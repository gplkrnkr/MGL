import type { ReactNode } from 'react'

/** Layout for public pages (sign-in, public job pages): the brand, plus optional header actions. */
export function PublicLayout({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <header className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          {/* A plain link (full page load): the home page is served outside this app. */}
          <a href="/" className="inline-flex items-center gap-2">
            <img src="/mgl-logo-mark.png" alt="" className="h-10 w-auto" />
            <span className="font-display font-bold text-primary text-lg">My Grand Labour</span>
          </a>
          {actions ? <div className="flex items-center gap-4 text-sm">{actions}</div> : null}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4">{children}</main>
      <footer className="max-w-5xl mx-auto px-4 py-6 text-sm text-text-muted">
        <a href="/privacy.html">Privacy and cookies</a>
      </footer>
    </div>
  )
}
