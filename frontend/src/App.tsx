import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from '@/context/UserContext'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Library from '@/pages/Library'
import BookDetail from '@/pages/BookDetail'
import Reader from '@/pages/Reader'
import Search from '@/pages/Search'
import Stats from '@/pages/Stats'

function AppRoutes() {
  const { user } = useUser()

  if (!user) return <Login />

  return (
    <Routes>
      {/* Lector — pantalla completa, sin sidebar */}
      <Route path="library/:id/read" element={<Reader />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<BookDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="stats" element={<Stats />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  )
}
