import type { ReactNode } from 'react'

/** Layout for sign-in pages: just the brand, linking back to the public home page. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <header className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-2">
          {/* A plain link (full page load): the home page is served outside this app. */}
          <a href="/" className="inline-flex items-center gap-2">
            <img src="/mgl-logo-mark.png" alt="" className="h-10 w-auto" />
            <span className="font-display font-bold text-primary text-lg">My Grand Labour</span>
          </a>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4">{children}</main>
    </div>
  )
}
