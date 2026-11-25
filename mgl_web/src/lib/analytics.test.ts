// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://mygrandlabour.com/"}
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import raw from '../../public/analytics.js?raw'
import app from '../App.tsx?raw'

const source = raw.replace(/MEASUREMENT_ID = '[^']*'/, "MEASUREMENT_ID = 'G-TEST'")
const w = window as unknown as { dataLayer?: ArrayLike<unknown>[]; [key: string]: unknown }
const load = (src = source) => new Function(src)()
const addListener = vi.spyOn(document, 'addEventListener')
const views = () =>
  (w.dataLayer ?? [])
    .map((a) => Array.from(a))
    .filter((a) => a[1] === 'page_view')
    .map((a) => (a[2] as { page_location: string }).page_location.replace('https://mygrandlabour.com', ''))
const googleTag = () => document.querySelector('script[src*="googletagmanager"]')
const click = (text: string) =>
  [...document.querySelectorAll('button')].find((b) => b.textContent === text)!.click()

beforeEach(() => {
  localStorage.clear()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  delete w.dataLayer
  delete w.mglAnalytics
  delete w['ga-disable-G-TEST']
})

// Each load adds a click listener to the shared document; a real page only loads once.
afterEach(() => {
  for (const [type, listener] of addListener.mock.calls) document.removeEventListener(type, listener)
  addListener.mockClear()
})

describe('analytics', () => {
  it('does nothing without an ID', () => {
    load(raw.replace(/MEASUREMENT_ID = '[^']*'/, "MEASUREMENT_ID = ''"))
    expect(window.mglAnalytics).toBeUndefined()
  })

  it('does nothing on another host', () => {
    load(source.replace("HOST = 'mygrandlabour.com'", "HOST = 'other.example'"))
    expect(window.mglAnalytics).toBeUndefined()
  })

  it('loads nothing until the visitor accepts', () => {
    load()
    window.mglAnalytics!.pageView('/jobs', 'Jobs')
    expect(googleTag()).toBeNull()
    click('Accept')
    expect(googleTag()).not.toBeNull()
    expect(views()).toEqual(['/jobs'])
    expect(document.getElementById('mgl-consent')).toBeNull()
  })

  it('stays off after Decline, and can be changed later', () => {
    load()
    window.mglAnalytics!.pageView('/jobs', 'Jobs')
    click('Decline')
    window.mglAnalytics!.pageView('/login', 'Sign in')
    expect(googleTag()).toBeNull()
    expect(document.getElementById('mgl-consent')).toBeNull()
    document.body.insertAdjacentHTML('beforeend', '<button data-cookie-settings>Cookie settings</button>')
    click('Cookie settings')
    click('Accept')
    expect(views()).toEqual(['/login'])
    document.cookie = '_ga=1; path=/'
    click('Cookie settings')
    click('Decline')
    expect(w['ga-disable-G-TEST']).toBe(true)
    expect(document.cookie).not.toContain('_ga')
  })

  it('masks private IDs and unknown paths, skips private portals and repeats', () => {
    localStorage.setItem('mgl_analytics_consent', 'granted')
    load()
    for (const p of ['/jobs/abc-1', '/jobs/abc-1', '/employer/jobs/xyz/applicants', '/admin/documents', '/employer/jobs/xyz', '/919999999999']) {
      window.mglAnalytics!.pageView(p, 't')
      expect(w['ga-disable-G-TEST'], p).toBe(p.startsWith('/admin'))
    }
    expect(views()).toEqual(['/jobs/abc-1', '/employer/jobs/:id/applicants', '/employer/jobs/:id', '/not-found'])
  })

  it('knows every tracked route in App.tsx', () => {
    localStorage.setItem('mgl_analytics_consent', 'granted')
    load()
    for (const [, p] of app.matchAll(/path="(\/[^"]*)"/g)) window.mglAnalytics!.pageView(p.replace(/:\w+/g, 'x'), 't')
    expect(views()).not.toContain('/not-found')
  })
})
