import { createContext, useContext, useState } from 'react'

export interface User {
  id: string
  name: string
  email: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    const stored = localStorage.getItem('bookshelf_user')
    return stored ? JSON.parse(stored) : null
  })

  const setUser = (u: User) => {
    localStorage.setItem('bookshelf_user', JSON.stringify(u))
    localStorage.setItem('bookshelf_user_id', u.id)
    setUserState(u)
  }

  const logout = () => {
    localStorage.removeItem('bookshelf_user')
    localStorage.removeItem('bookshelf_user_id')
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
