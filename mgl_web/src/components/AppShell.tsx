import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { showPreviews } from '../lib/config'
import { Button } from './ui/Button'

interface PortalNavItem {
  to: string
  label: string
}

const allNavItems = [
  { to: '/', label: 'Home', icon: '🏠', description: 'Overview and sign-in' },
  {
    to: '/profile',
    label: 'Worker Registration',
    icon: '🪪',
    description: 'Create your worker profile and MGL ID',
  },
  { to: '/jobs', label: 'Find Jobs', icon: '📱', description: 'Browse open jobs and apply' },
  {
    to: '/employer',
    label: 'Employer Portal',
    icon: '🏢',
    description: 'Register your company and post jobs',
  },
  {
    preview: true,
    to: '/demo/agent-app',
    label: 'Agent App (MSC)',
    icon: '🧑‍💼',
    description: 'Field registrations with an offline queue (demo)',
  },
  {
    preview: true,
    to: '/demo/fraud-detection',
    label: 'Fraud Detection',
    icon: '🛡️',
    description: 'Sample fraud flags (demo data)',
  },
  {
    preview: true,
    to: '/demo/govt-dashboard',
    label: 'Govt Dashboard',
    icon: '📊',
    description: 'Aggregated stats (sample data)',
  },
  {
    preview: true,
    to: '/demo/ai-matching',
    label: 'AI Matching Engine',
    icon: '🤖',
    description: 'Match workers to jobs (demo)',
  },
  {
    preview: true,
    to: '/demo/gcc-overseas',
    label: 'GCC Overseas',
    icon: '✈️',
    description: 'Document readiness tracker (demo)',
  },
]

const navItems = allNavItems.filter((item) => showPreviews || !('preview' in item))

const allRoleTabs = [
  { label: 'Workers', icon: '👷', to: '/login', prefixes: ['/login', '/jobs', '/applications', '/profile'] },
  { label: 'Employers', icon: '🏢', to: '/employer/login', prefixes: ['/employer'] },
  { label: 'Government', icon: '🏛️', to: '/demo/govt-dashboard', prefixes: ['/demo/govt-dashboard'], preview: true },
  { label: 'GCC', icon: '✈️', to: '/demo/gcc-overseas', prefixes: ['/demo/gcc-overseas'], preview: true },
]

const roleTabs = allRoleTabs.filter((tab) => showPreviews || !tab.preview)

export function AppShell({
  title,
  portalTitle,
  portalNavItems,
  children,
}: {
  title?: string
  portalTitle?: string
  portalNavItems?: PortalNavItem[]
  children: ReactNode
}) {
  const { pathname } = useLocation()
  const { profile, logout } = useAuth()

  return (
    <div className="h-screen bg-page flex flex-col">
      <header className="bg-primary shrink-0">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/mgl-logo-mark.png" alt="" className="h-10 w-auto" />
            <span className="text-text-inverse/60 text-sm">Platform</span>
          </Link>

          <nav className="flex items-center gap-2 flex-wrap">
            {roleTabs.map((tab) => {
              const active = tab.prefixes.some((p) => pathname.startsWith(p))
              return (
                <Link
                  key={tab.label}
                  to={tab.to}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${
                    active ? 'bg-accent text-primary' : 'bg-primary-dark text-text-inverse/80 hover:text-text-inverse'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </Link>
              )
            })}
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-success-light text-success flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success inline-block" />
              Backend Connected
            </span>
          </nav>
        </div>
      </header>

      {portalNavItems && (
        <div className="bg-background border-b border-border shrink-0">
          <div className="px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {portalTitle && <span className="text-text-muted text-sm">{portalTitle}</span>}
              <nav className="flex items-center gap-4">
                {portalNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      `text-sm font-semibold ${isActive ? 'text-primary' : 'text-text-muted hover:text-text'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
            {profile && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-muted">{profile.phone}</span>
                <Button variant="secondary" onClick={logout} className="h-9 px-4 text-sm">
                  Log out
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <aside className="w-72 shrink-0 bg-background border-r border-border p-3 hidden sm:flex sm:flex-col sm:gap-3 overflow-y-auto">
          <p className="text-xs font-bold text-text-muted tracking-wider px-2">PRODUCT COMPONENTS</p>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-start gap-3 px-3 py-2 rounded-md ${
                    isActive ? 'bg-primary text-text-inverse' : 'text-text hover:bg-page'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="text-lg leading-6">{item.icon}</span>
                    <span className="flex flex-col">
                      <span className="text-sm font-bold">{item.label}</span>
                      <span className={`text-xs ${isActive ? 'text-text-inverse/70' : 'text-text-muted'}`}>
                        {item.description}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            <Link to="/" className="text-sm font-semibold text-text-muted hover:text-primary px-2">
              ← Back to home
            </Link>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {title && <h1 className="text-2xl font-bold text-text mb-1">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  )
}
