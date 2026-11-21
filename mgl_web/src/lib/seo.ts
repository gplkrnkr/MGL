import { useEffect } from 'react'
import type { Job } from '../api/types'

export const SITE_URL = 'https://mygrandlabour.com'

export interface PageHead {
  title?: string
  description?: string
  canonical?: string
  /** e.g. "noindex" for sample or closed jobs. */
  robots?: string
  /** Structured data for search engines (JSON-LD). */
  jsonLd?: object | null
}

const MARK = 'data-page-head'

function addElement(tag: string, attrs: Record<string, string>, text?: string) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
  el.setAttribute(MARK, '')
  if (text !== undefined) el.textContent = text
  document.head.appendChild(el)
}

/**
 * Sets this page's title, description, canonical URL, robots and JSON-LD, and removes them again
 * when the page goes away, so a sample job's "noindex" never leaks onto the next page.
 */
export function usePageHead(head: PageHead | null) {
  const key = JSON.stringify(head)
  useEffect(() => {
    if (!head) return
    const previousTitle = document.title
    if (head.title) document.title = head.title
    // index.html already has a generic description: update it rather than add a second one.
    const descriptionMeta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = descriptionMeta?.content
    if (head.description) {
      if (descriptionMeta) descriptionMeta.content = head.description
      else addElement('meta', { name: 'description', content: head.description })
    }
    if (head.canonical) addElement('link', { rel: 'canonical', href: head.canonical })
    if (head.robots) addElement('meta', { name: 'robots', content: head.robots })
    if (head.jsonLd) {
      addElement('script', { type: 'application/ld+json' }, JSON.stringify(head.jsonLd))
    }
    return () => {
      document.head.querySelectorAll(`[${MARK}]`).forEach((el) => el.remove())
      if (descriptionMeta && previousDescription !== undefined) {
        descriptionMeta.content = previousDescription
      }
      document.title = previousTitle
    }
    // key captures every field of head
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

/**
 * Google for Jobs markup (schema.org JobPosting), or null when the job must not have any:
 * sample jobs (Google forbids markup for jobs that don't exist), closed jobs (expired postings
 * must lose their markup), and jobs missing Google's required employer name or a description
 * that differs from the title. directApply is left out: applying needs a sign-in and a second
 * click, which Google doesn't count as direct apply.
 */
export function jobPostingJsonLd(job: Job, siteUrl: string = SITE_URL): object | null {
  const employer = job.employerName.trim()
  const description = job.description.trim()
  if (job.isSample || job.status !== 'open') return null
  if (!employer || !description || description === job.title.trim()) return null

  const posting: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description,
    datePosted: job.createdAt.slice(0, 10),
    hiringOrganization: { '@type': 'Organization', name: employer },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'IN' },
    },
    url: `${siteUrl}/jobs/${job.id}`,
  }
  if (job.wageMin > 0 || job.wageMax > 0) {
    posting.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.wageMin,
        maxValue: Math.max(job.wageMin, job.wageMax),
        unitText: job.wagePeriod === 'daily' ? 'DAY' : 'MONTH',
      },
    }
  }
  return posting
}

/** Title, description, canonical, robots and JSON-LD for a job page. */
export function jobPageHead(job: Job, siteUrl: string = SITE_URL): PageHead {
  const pay =
    job.wageMin === job.wageMax
      ? `₹${job.wageMin.toLocaleString('en-IN')}`
      : `₹${job.wageMin.toLocaleString('en-IN')}–${job.wageMax.toLocaleString('en-IN')}`
  const where = job.location ? ` in ${job.location}` : ''
  const jsonLd = jobPostingJsonLd(job, siteUrl)
  return {
    title: `${job.title}${where} · My Grand Labour`,
    description: `${job.title}${where}. ${pay} per ${job.wagePeriod === 'daily' ? 'day' : 'month'}. View the job and apply on My Grand Labour.`,
    canonical: `${siteUrl}/jobs/${job.id}`,
    robots: job.isSample || job.status !== 'open' ? 'noindex' : undefined,
    jsonLd,
  }
}
