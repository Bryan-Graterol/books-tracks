import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, Users, ShieldCheck, FlaskConical, ArrowLeft, X } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { adminApi } from '@/services/books'
import { useQuery } from '@/hooks/useQuery'
import { ApiError } from '@/services/api'
import Button from '@/components/ui/Button'

export default function Admin() {
  const { user } = useUser()
  const navigate = useNavigate()

  // Guard: redirect if not admin
  if (!user?.is_admin) {
    navigate('/dashboard', { replace: true })
    return null
  }

  return <AdminPanel />
}

function AdminPanel() {
  const { data: users, loading: loadingUsers } = useQuery(
    () => adminApi.listUsers(), []
  )
  const { data: allowed, loading: loadingAllowed, refetch: refetchAllowed } = useQuery(
    () => adminApi.listAllowed(), []
  )

  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAdding(true)
    setAddError('')
    try {
      await adminApi.addAllowed(newEmail.trim().toLowerCase())
      setNewEmail('')
      refetchAllowed()
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 409
        ? 'Ese email ya está en la lista'
        : (err instanceof Error ? err.message : 'Error al agregar')
      setAddError(msg)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (email: string) => {
    setRemovingEmail(email)
    try {
      await adminApi.removeAllowed(email)
      refetchAllowed()
    } finally {
      setRemovingEmail(null)
    }
  }

  const registeredEmails = new Set(users?.map((u) => u.email) ?? [])

  return (
    <div className="animate-fade-in max-w-2xl">
      <button
        onClick={() => history.back()}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Panel de Admin</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Control de acceso a Books-Tracks.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bento-card flex flex-col gap-1">
          <span className="text-label">Usuarios</span>
          <p className="text-2xl font-bold text-zinc-100 tabular-nums">
            {loadingUsers ? '—' : users?.length ?? 0}
          </p>
          <p className="text-xs text-zinc-500">registrados</p>
        </div>
        <div className="bento-card flex flex-col gap-1">
          <span className="text-label">Permitidos</span>
          <p className="text-2xl font-bold text-zinc-100 tabular-nums">
            {loadingAllowed ? '—' : allowed?.length ?? 0}
          </p>
          <p className="text-xs text-zinc-500">emails en lista</p>
        </div>
        <div className="bento-card flex flex-col gap-1 col-span-2 sm:col-span-1">
          <span className="text-label">Pendientes</span>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">
            {loadingAllowed || loadingUsers
              ? '—'
              : (allowed ?? []).filter((a) => !registeredEmails.has(a.email)).length}
          </p>
          <p className="text-xs text-zinc-500">invitados sin registrar</p>
        </div>
      </div>

      {/* Add allowed email */}
      <div className="bento-card mb-4">
        <p className="text-label mb-3">Agregar email permitido</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="nuevo@usuario.com"
            className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 transition-colors"
          />
          <Button type="submit" disabled={adding || !newEmail.trim()}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Agregar</>}
          </Button>
        </form>
        {addError && (
          <p className="text-xs text-red-400 mt-2">{addError}</p>
        )}
        <p className="text-xs text-zinc-600 mt-2">
          Una vez agregado, esa persona podrá crear su cuenta con ese email.
        </p>
      </div>

      {/* Allowed emails list */}
      <div className="bento-card mb-4">
        <p className="text-label mb-3">Emails permitidos</p>
        {loadingAllowed ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          </div>
        ) : (allowed?.length ?? 0) === 0 ? (
          <p className="text-sm text-zinc-600 py-2">No hay emails en la lista.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {allowed!.map((entry) => {
              const isRegistered = registeredEmails.has(entry.email)
              return (
                <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{entry.email}</p>
                    <p className="text-xs text-zinc-600">
                      {isRegistered
                        ? <span className="text-green-400">✓ Registrado</span>
                        : 'Pendiente de registro'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(entry.email)}
                    disabled={removingEmail === entry.email}
                    className="text-zinc-700 hover:text-red-400 transition-colors shrink-0"
                    title="Quitar"
                  >
                    {removingEmail === entry.email
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <X className="w-4 h-4" />}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Registered users */}
      <div className="bento-card">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-zinc-500" />
          <p className="text-label">Usuarios registrados</p>
        </div>
        {loadingUsers ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {users?.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2.5 border-b border-surface-border last:border-0">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{u.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {u.is_admin && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      Admin
                    </span>
                  )}
                  {u.is_demo && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 flex items-center gap-1">
                      <FlaskConical className="w-3 h-3" /> Demo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
