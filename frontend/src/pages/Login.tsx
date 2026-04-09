import { useState } from 'react'
import { BookMarked, Loader2, FlaskConical } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { usersApi } from '@/services/books'
import { ApiError } from '@/services/api'
import Button from '@/components/ui/Button'

const DEMO_EMAIL = 'demo@bookshelf.demo'

export default function Login() {
  const { setUser } = useUser()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState('')

  const loginWith = async (userEmail: string, userName?: string) => {
    try {
      let user
      try {
        user = await usersApi.create({ name: userName ?? userEmail, email: userEmail })
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          user = await usersApi.getByEmail(userEmail)
        } else {
          throw err
        }
      }
      setUser({
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        is_demo: user.is_demo,
      })
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 403
        ? 'Este email no está autorizado. Contacta al administrador.'
        : (err instanceof Error ? err.message : 'Error al conectar con el servidor')
      setError(msg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')
    await loginWith(email.trim().toLowerCase(), name.trim())
    setLoading(false)
  }

  const handleDemo = async () => {
    setDemoLoading(true)
    setError('')
    await loginWith(DEMO_EMAIL)
    setDemoLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-serif text-2xl font-semibold text-zinc-100">BookShelf</span>
        </div>

        {/* Demo banner */}
        <div className="bento-card mb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center shrink-0">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200">¿Solo quieres explorar?</p>
            <p className="text-xs text-zinc-500">Entra con la cuenta de prueba, sin registro.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDemo}
            disabled={demoLoading}
            className="shrink-0 border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
          >
            {demoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Probar'}
          </Button>
        </div>

        {/* Login form */}
        <div className="bento-card">
          <h1 className="text-lg font-semibold text-zinc-100 mb-1">Acceder</h1>
          <p className="text-sm text-zinc-500 mb-6">
            Ingresa con tu email autorizado.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-label mb-2 block">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-label mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading || !name.trim() || !email.trim()} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
