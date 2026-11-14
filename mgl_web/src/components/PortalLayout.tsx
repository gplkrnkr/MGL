import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import mglLogo from '../assets/mgl-logo.png'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/Button'

interface NavItem {
  to: string
  label: string
}

/**
 * Layout for signed-in pages. Each role passes only its own menu, so a worker never sees
 * employer links and vice versa. The logo goes to the role's own home page, not the public site.
 */
export function PortalLayout({
  title,
  navItems,
  homeTo,
  children,
}: {
  title: string
  navItems: NavItem[]
  homeTo: string
  children: ReactNode
}) {
  const { profile, logout } = useAuth()

  const signOut = () => {
    logout()
    // Full page load: the public home page is served outside this app.
    window.location.assign('/')
  }

  return (
    <div className="min-h-screen bg-page">
      <header className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="flex items-center gap-4">
            <Link to={homeTo} className="flex items-center gap-2">
              <img src={mglLogo} alt="MyGrandLabour" className="h-8 w-8 object-contain" />
              <span className="font-bold text-primary text-lg">MyGrandLabour</span>
            </Link>
            <span className="text-text-muted text-sm hidden sm:inline">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted hidden sm:inline">{profile?.phone}</span>
            <Button variant="secondary" onClick={signOut} className="h-9 px-4 text-sm">
              Log out
            </Button>
          </div>
          <nav className="w-full flex items-center gap-5 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-semibold whitespace-nowrap ${isActive ? 'text-primary' : 'text-text-muted hover:text-text'}`
                }
                end
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
