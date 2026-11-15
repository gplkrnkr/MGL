import { describe, expect, it } from 'vitest'
import { pageTitle } from './pageTitles'
import app from '../App.tsx?raw'
import nginx from '../../../deploy/nginx/mygrandlabour.conf?raw'

describe('pageTitle', () => {
  it('names each kind of page', () => {
    expect(pageTitle('/login')).toBe('Sign in · My Grand Labour')
    expect(pageTitle('/jobs')).toBe('Find work · My Grand Labour')
    expect(pageTitle('/jobs/abc')).toBe('Job details · My Grand Labour')
    expect(pageTitle('/employer/jobs/abc/applicants')).toBe('Applicants · My Grand Labour')
    expect(pageTitle('/employer/jobs/new')).toBe('Post a job · My Grand Labour')
    expect(pageTitle('/nope')).toBe('Page not found · My Grand Labour')
  })

  it('has a title for every route in App.tsx', () => {
    const paths = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*' && p !== '/')
    for (const path of paths) {
      expect(pageTitle(path.replace(/:\w+/g, 'x')), path).not.toMatch(/^Page not found/)
    }
  })

  // nginx only serves the app (status 200) for these first path segments; anything else is a real 404.
  it('every route is covered by the nginx app-route rule', () => {
    const rule = nginx.match(/location ~ \^\/\(([a-z|]+)\)\(\/\|\$\)/)
    expect(rule, 'app-route location in mygrandlabour.conf').not.toBeNull()
    const allowed = new Set(rule![1].split('|'))
    const segments = [...app.matchAll(/path="\/([a-z-]+)/g)].map((m) => m[1])
    for (const segment of segments) expect(allowed, segment).toContain(segment)
  })
})
