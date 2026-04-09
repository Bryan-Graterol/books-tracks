import { createContext, useContext, useState } from 'react'

export interface User {
  id: string
  name: string
  email: string
  is_admin: boolean
  is_demo: boolean
}

interface UserContextType {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const stored = localStorage.getItem('books_tracks_user')
    return stored ? JSON.parse(stored) : null
  })

  const setUser = (u: User) => {
    localStorage.setItem('books_tracks_user', JSON.stringify(u))
    localStorage.setItem('books_tracks_user_id', u.id)
    setUserState(u)
  }

  const logout = () => {
    localStorage.removeItem('books_tracks_user')
    localStorage.removeItem('books_tracks_user_id')
    setUserState(null)
  }

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be inside UserProvider')
  return ctx
}
