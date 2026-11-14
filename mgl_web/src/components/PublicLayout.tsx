import type { ReactNode } from 'react'
import mglLogo from '../assets/mgl-logo.png'

/** Layout for sign-in pages: just the brand, linking back to the public home page. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <header className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-2">
          {/* A plain link (full page load): the home page is served outside this app. */}
          <a href="/" className="inline-flex items-center gap-2">
            <img src={mglLogo} alt="MyGrandLabour" className="h-8 w-8 object-contain" />
            <span className="font-bold text-primary text-lg">MyGrandLabour</span>
          </a>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4">{children}</main>
    </div>
  )
}
