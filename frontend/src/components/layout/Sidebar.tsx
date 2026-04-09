import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Search,
  BarChart3,
  BookMarked,
  LogOut,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/context/UserContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/library', icon: BookOpen, label: 'Library' },
  { to: '/search', icon: Search, label: 'Add Book' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/about', icon: Info, label: 'About' },
]

export default function Sidebar() {
  const { user, logout } = useUser()
  const initials = user?.name?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-surface-border bg-surface-card px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
          <BookMarked className="w-4 h-4 text-amber-400" />
        </div>
        <span className="font-serif text-lg font-semibold text-zinc-100">BookShelf</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-surface-hover',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-amber-400' : 'text-zinc-500')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-hover mt-4 group">
        <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{user?.name}</p>
          <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          title="Cerrar sesión"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
