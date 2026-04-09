import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Loader2 } from 'lucide-react'
import BookCover from '@/components/book/BookCover'
import StatusBadge from '@/components/book/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import StarRating from '@/components/ui/StarRating'
import { STATUS_LABEL, readingProgress } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import { libraryApi } from '@/services/books'
import type { ReadingStatus } from '@/types'

const TABS: Array<{ value: ReadingStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'reading', label: 'Leyendo' },
  { value: 'want_to_read', label: 'Por leer' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Completado' },
  { value: 'abandoned', label: 'Abandonado' },
]

export default function Library() {
  const navigate = useNavigate()
  const [active, setActive] = useState<ReadingStatus | 'all'>('all')

  const { data: books, loading, error } = useQuery(() => libraryApi.getAll(), [])

  const filtered = active === 'all'
    ? (books ?? [])
    : (books ?? []).filter((ub) => ub.status === active)

  const countFor = (s: ReadingStatus | 'all') =>
    s === 'all' ? (books?.length ?? 0) : (books?.filter((b) => b.status === s).length ?? 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Mi Biblioteca</h1>
          <p className="text-zinc-500 text-sm mt-1">{books?.length ?? 0} libros en total</p>
        </div>
        <Button onClick={() => navigate('/search')}>
          <Plus className="w-4 h-4" /> Agregar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const count = countFor(tab.value)
          const isActive = active === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActive(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive ? 'bg-amber-400/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-amber-400/20 text-amber-400' : 'bg-surface-hover text-zinc-600'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-zinc-500">No hay libros con estado "{active !== 'all' ? STATUS_LABEL[active] : 'seleccionado'}"</p>
          <Button variant="outline" onClick={() => navigate('/search')}>
            <Plus className="w-4 h-4" /> Agregar uno
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((ub) => {
            const progress = readingProgress(ub.current_page, ub.book.total_pages)
            return (
              <div
                key={ub.id}
                onClick={() => navigate(`/library/${ub.id}`)}
                className="bento-card flex items-center gap-4 cursor-pointer hover:bg-surface-hover hover:border-zinc-700 group transition-all"
              >
                <BookCover url={ub.book.cover_url} title={ub.book.title} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-zinc-100 truncate group-hover:text-amber-400 transition-colors">
                      {ub.book.title}
                    </h3>
                    <StatusBadge status={ub.status} />
                  </div>
                  <p className="text-sm text-zinc-500 mb-2">{ub.book.author}</p>
                  {ub.status === 'reading' && ub.book.total_pages && (
                    <div>
                      <div className="flex justify-between text-xs text-zinc-600 mb-1">
                        <span>p. {ub.current_page}</span>
                        <span>{progress}%</span>
                      </div>
                      <ProgressBar value={progress} className="max-w-xs" />
                    </div>
                  )}
                  {ub.status === 'completed' && ub.rating && (
                    <StarRating value={ub.rating} readOnly size="sm" />
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {ub.book.year && <span className="text-xs text-zinc-600">{ub.book.year}</span>}
                  {ub.book.genre && (
                    <span className="text-xs text-zinc-500 bg-surface-hover px-2 py-0.5 rounded-md">{ub.book.genre}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 mt-1" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
