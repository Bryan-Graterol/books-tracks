import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Search, BarChart3, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/context/UserContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/library', icon: BookOpen, label: 'Libros' },
  { to: '/search', icon: Search, label: 'Buscar' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
]

export default function BottomNav() {
  const { logout } = useUser()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface-card border-t border-surface-border">
      <div className="flex items-center">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive ? 'text-amber-400' : 'text-zinc-500',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive ? 'text-amber-400' : 'text-zinc-500')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        {/* Logout */}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Salir
        </button>
      </div>
    </nav>
  )
}
