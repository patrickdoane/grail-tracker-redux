import { NavLink, Outlet } from 'react-router-dom'
import './AppShell.css'

const NAV_LINKS = [
  { to: '/items', label: 'Items' },
  { to: '/sets', label: 'Sets & Runewords' },
  { to: '/stats', label: 'Stats & Insights' },
  { to: '/settings', label: 'Settings' },
]

function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="app-bar__brand">
          <span className="app-bar__title">Grail Tracker</span>
          <span className="app-bar__subtitle">Redux</span>
        </div>
        <nav className="app-bar__nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'app-bar__link app-bar__link--active' : 'app-bar__link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-shell__main">
        <div className="app-shell__content" role="presentation">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppShell
