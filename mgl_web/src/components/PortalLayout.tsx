import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import mglLogo from '../assets/mgl-logo.png'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/Button'

interface NavItem {
  to: string
  label: string
}

export function PortalLayout({
  title,
  navItems,
  children,
}: {
  title: string
  navItems: NavItem[]
  children: ReactNode
}) {
  const { profile, logout } = useAuth()

  return (
    <div className="min-h-screen bg-page">
      <header className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={mglLogo} alt="MyGrandLabour" className="h-8 w-8 object-contain" />
              <span className="font-bold text-primary text-lg">MyGrandLabour</span>
            </Link>
            <span className="text-text-muted text-sm">{title}</span>
          </div>
          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-semibold ${isActive ? 'text-primary' : 'text-text-muted hover:text-text'}`
                }
                end
              >
                {item.label}
              </NavLink>
            ))}
            <span className="text-sm text-text-muted">{profile?.phone}</span>
            <Button variant="secondary" onClick={logout} className="h-9 px-4 text-sm">
              Log out
            </Button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
