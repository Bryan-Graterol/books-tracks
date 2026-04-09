import { BookCheck, Clock, Star, TrendingUp, BookOpen, Flame, Loader2 } from 'lucide-react'
import BentoCard from '@/components/bento/BentoCard'
import StarRating from '@/components/ui/StarRating'
import { formatMinutes, STATUS_LABEL, STATUS_COLOR } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import { libraryApi, statsApi } from '@/services/books'
import type { ReadingStatus } from '@/types'

const GENRE_COLORS = ['bg-amber-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-pink-400', 'bg-orange-400']

export default function Stats() {
  const { data: stats, loading: loadingStats } = useQuery(() => statsApi.get(), [])
  const { data: books, loading: loadingBooks } = useQuery(() => libraryApi.getAll(), [])

  if (loadingStats || loadingBooks) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    )
  }

  const maxPages = stats?.monthly_pages?.length
    ? Math.max(...stats.monthly_pages.map((m) => Number(m.pages)))
    : 1
  const maxGenre = stats?.by_genre?.length
    ? Math.max(...stats.by_genre.map((g) => Number(g.count)))
    : 1

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Estadísticas</h1>
        <p className="text-zinc-500 text-sm mt-1">Tu progreso lector.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(130px,auto)]">

        <BentoCard size="1x1" accent className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label">Total</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-stat">{stats?.total_books ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-1">libros en biblioteca</p>
          </div>
        </BentoCard>

        <BentoCard size="1x1" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label">Este año</span>
            <BookCheck className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-stat">{stats?.books_this_year ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-1">completados</p>
          </div>
          <p className="text-xs text-zinc-600">{stats?.pages_this_year ?? 0} págs · Total: {stats?.total_completed ?? 0}</p>
        </BentoCard>

        <BentoCard size="1x1" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label">Racha</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-stat">{stats?.current_streak ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-1">días seguidos</p>
          </div>
          <p className="text-xs text-zinc-600">Mejor: {stats?.longest_streak ?? 0} días</p>
        </BentoCard>

        <BentoCard size="1x1" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label">Tiempo</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-stat">{formatMinutes(stats?.total_minutes ?? 0)}</p>
            <p className="text-xs text-zinc-500 mt-1">total acumulado</p>
          </div>
        </BentoCard>

        {/* Monthly pages chart */}
        <BentoCard size="2x1" className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-label">Páginas por mes</span>
            <TrendingUp className="w-4 h-4 text-zinc-500" />
          </div>
          {(stats?.monthly_pages?.length ?? 0) > 0 ? (
            <div className="flex items-end gap-2 flex-1">
              {stats!.monthly_pages.map((m) => {
                const h = maxPages > 0 ? (Number(m.pages) / maxPages) * 100 : 0
                return (
                  <div key={String(m.month)} className="flex flex-col items-center gap-1.5 flex-1 group">
                    <span className="text-xs text-zinc-600 group-hover:text-zinc-400 tabular-nums">{m.pages}</span>
                    <div className="w-full bg-surface-border rounded-t-md overflow-hidden relative" style={{ height: '64px' }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-amber-400/70 group-hover:bg-amber-400 transition-all rounded-t-md" style={{ height: `${h}%` }} />
                    </div>
                    <span className="text-xs text-zinc-600">{m.month}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-600 flex-1 flex items-center">Sin datos de sesiones aún.</p>
          )}
        </BentoCard>

        <BentoCard size="1x1" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label">Rating</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-stat">{(stats?.avg_rating ?? 0).toFixed(1)}</p>
            <p className="text-xs text-zinc-500 mt-1">promedio</p>
          </div>
          <StarRating value={Math.round(stats?.avg_rating ?? 0)} readOnly size="sm" />
        </BentoCard>

        <BentoCard size="1x1" className="flex flex-col justify-between">
          <span className="text-label">Este mes</span>
          <div>
            <p className="text-stat">{stats?.books_this_month ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-1">libros leídos</p>
          </div>
        </BentoCard>

        {/* By status */}
        <BentoCard size="2x1" className="flex flex-col">
          <span className="text-label mb-4">Por estado</span>
          <div className="flex flex-col gap-2.5">
            {stats?.by_status
              ? (Object.entries(stats.by_status) as [ReadingStatus, number][])
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${STATUS_COLOR[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                      <div className="flex-1 progress-track">
                        <div className="h-full bg-zinc-600 rounded-full" style={{ width: `${(count / (stats.total_books || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500 tabular-nums w-4 text-right">{count}</span>
                    </div>
                  ))
              : <p className="text-sm text-zinc-600">Sin datos.</p>
            }
          </div>
        </BentoCard>

        {/* By genre */}
        <BentoCard size="2x1" className="flex flex-col">
          <span className="text-label mb-4">Por género</span>
          <div className="flex flex-col gap-2.5">
            {(stats?.by_genre?.length ?? 0) > 0
              ? stats!.by_genre.map((g, i) => (
                  <div key={String(g.genre)} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-24 shrink-0 truncate">{g.genre}</span>
                    <div className="flex-1 progress-track">
                      <div className={`h-full rounded-full ${GENRE_COLORS[i % GENRE_COLORS.length]}`}
                        style={{ width: `${(Number(g.count) / maxGenre) * 100}%` }} />
                    </div>
                    <span className="text-xs text-zinc-500 tabular-nums w-4 text-right">{g.count}</span>
                  </div>
                ))
              : <p className="text-sm text-zinc-600">Sin géneros registrados.</p>
            }
          </div>
        </BentoCard>

        {/* All books */}
        {(books?.length ?? 0) > 0 && (
          <BentoCard size="4x1" className="flex flex-col">
            <span className="text-label mb-4">Todos los libros</span>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {books!.map((ub) => (
                <div key={ub.id} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                  <span className="text-sm text-zinc-300 truncate flex-1">{ub.book.title}</span>
                  {ub.rating && <StarRating value={ub.rating} readOnly size="sm" />}
                </div>
              ))}
            </div>
          </BentoCard>
        )}

      </div>
    </div>
  )
}
