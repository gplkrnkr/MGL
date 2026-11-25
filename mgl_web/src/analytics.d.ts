export {}

declare global {
  interface Window {
    /** From public/analytics.js; absent when analytics is off (other hosts, no ID). */
    mglAnalytics?: { pageView(path: string, title: string): void }
  }
}
