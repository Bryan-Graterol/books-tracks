import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
