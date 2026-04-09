import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Clock, BookCheck, Star, Plus, ChevronRight, BookOpen, Loader2 } from 'lucide-react'
import BentoCard from '@/components/bento/BentoCard'
import BookCover from '@/components/book/BookCover'
import ProgressBar from '@/components/ui/ProgressBar'
import StarRating from '@/components/ui/StarRating'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { readingProgress, formatMinutes, NOTE_ICON, NOTE_COLOR } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import { libraryApi, sessionsApi, notesApi, statsApi } from '@/services/books'
import type { NoteWithBook, UserBook } from '@/types'

// ── Dot navigation ────────────────────────────────────────────────────────────
function NavDots({ total, active, onChange }: { total: number; active: number; onChange: (i: number) => void }) {
  if (total <= 1) return null
  return (
    <div className="flex justify-center gap-1.5 mt-3 shrink-0">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); onChange(i) }}
          className={`rounded-full transition-all duration-200 ${
            i === active ? 'w-4 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-500'
          }`}
        />
      ))}
    </div>
  )
}

// ── Book stack ────────────────────────────────────────────────────────────────
function BookStack({ books, navigate }: { books: UserBook[]; navigate: ReturnType<typeof useNavigate> }) {
  const [idx, setIdx] = useState(0)
  const paused = useRef(false)
  const active = books[idx]

  useEffect(() => {
    if (books.length <= 1) return
    const timer = setInterval(() => {
      if (!paused.current) setIdx((i) => (i + 1) % books.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [books.length])
  const next1 = books[(idx + 1) % books.length]
  const next2 = books[(idx + 2) % books.length]
  const prog = readingProgress(active.current_page, active.book.total_pages)

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false }}
    >
      {/* Active card */}
      <div
        onClick={() => navigate(`/library/${active.id}`)}
        className="flex gap-4 flex-1 min-h-0 rounded-xl bg-zinc-800/70 border border-zinc-700 p-4 cursor-pointer hover:bg-zinc-800 transition-colors relative z-10 shadow-md"
      >
        <BookCover url={active.book.cover_url} title={active.book.title} size="xl" />
        <div className="flex flex-col flex-1 min-w-0 justify-between">
          <div>
            <h2 className="font-serif text-base font-semibold text-zinc-100 leading-tight line-clamp-2">
              {active.book.title}
            </h2>
            <p className="text-zinc-500 text-xs mt-1 truncate">{active.book.author}</p>
            {active.book.genre && (
              <Badge className="mt-2 self-start bg-zinc-900 text-zinc-400 text-xs">{active.book.genre}</Badge>
            )}
          </div>
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>p. {active.current_page} / {active.book.total_pages ?? '?'}</span>
              <span>{prog}%</span>
            </div>
            <ProgressBar value={prog} />
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 self-center" />
      </div>

      {/* Peeking card 1 */}
      {books.length >= 2 && (
        <div
          onClick={() => setIdx((idx + 1) % books.length)}
          className="-mt-2 mx-3 rounded-b-xl bg-zinc-900 border border-t-0 border-zinc-800 px-4 py-2 z-0 relative cursor-pointer hover:bg-zinc-800/60 transition-colors"
        >
          <p className="text-xs text-zinc-500 truncate">{next1.book.title}</p>
        </div>
      )}

      {/* Peeking card 2 */}
      {books.length >= 3 && (
        <div
          onClick={() => setIdx((idx + 2) % books.length)}
          className="-mt-1 mx-6 rounded-b-xl bg-zinc-950 border border-t-0 border-zinc-800 px-4 py-1.5 z-[-1] relative cursor-pointer hover:bg-zinc-900 transition-colors"
        >
          <p className="text-xs text-zinc-600 truncate">{next2.book.title}</p>
        </div>
      )}

      <NavDots total={books.length} active={idx} onChange={setIdx} />
    </div>
  )
}

// ── Note stack ────────────────────────────────────────────────────────────────
function NoteStack({ notes, navigate }: { notes: NoteWithBook[]; navigate: ReturnType<typeof useNavigate> }) {
  const [idx, setIdx] = useState(0)
  const paused = useRef(false)
  const active = notes[idx]
  const next = notes[(idx + 1) % notes.length]

  useEffect(() => {
    if (notes.length <= 1) return
    const timer = setInterval(() => {
      if (!paused.current) setIdx((i) => (i + 1) % notes.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [notes.length])

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      onMouseEnter={() => { paused.current = true }}
      onMouseLeave={() => { paused.current = false }}
    >
      {/* Active note card */}
      <div
        onClick={() => navigate(`/library/${active.user_book_id}`)}
        className="flex items-start gap-3 flex-1 min-h-0 rounded-xl bg-zinc-800/70 border border-zinc-700 p-3.5 cursor-pointer hover:bg-zinc-800 transition-colors relative z-10 shadow-md"
      >
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${NOTE_COLOR[active.type]}`}>
          {NOTE_ICON[active.type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">
            {active.content}
          </p>
          <p className="text-xs text-zinc-600 mt-2 truncate">
            {active.book_title}{active.page_ref ? ` · p. ${active.page_ref}` : ''}
          </p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
      </div>

      {/* Peeking note */}
      {notes.length >= 2 && (
        <div
          onClick={() => setIdx((idx + 1) % notes.length)}
          className="-mt-2 mx-3 rounded-b-xl bg-zinc-900 border border-t-0 border-zinc-800 px-3.5 py-2 z-0 relative cursor-pointer hover:bg-zinc-800/60 transition-colors"
        >
          <p className="text-xs text-zinc-500 truncate">{next.content}</p>
        </div>
      )}

      {notes.length >= 3 && (
        <div
          className="-mt-1 mx-6 rounded-b-xl bg-zinc-950 border border-t-0 border-zinc-800 py-1.5 z-[-1] relative"
        />
      )}

      <NavDots total={Math.min(notes.length, 8)} active={idx} onChange={setIdx} />
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()

  const { data: allBooks, loading: loadingBooks } = useQuery(() => libraryApi.getAll(), [])
  const { data: stats, loading: loadingStats } = useQuery(() => statsApi.get(), [])
  const { data: recentNotes } = useQuery(() => notesApi.getAll(8), [])

  const readingBooks = allBooks?.filter((ub) => ub.status === 'reading') ?? []
  const wantToRead = allBooks?.filter((ub) => ub.status === 'want_to_read') ?? []

  const firstReading = readingBooks[0]
  const { data: sessions } = useQuery(
    () => firstReading ? sessionsApi.getForBook(firstReading.id) : Promise.resolve([]),
    [firstReading?.id],
  )

  const recentSessions = sessions?.slice(0, 4) ?? []
  const loading = loadingBooks || loadingStats

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-500 mt-1 text-sm">Tu resumen de lecturas.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">

        {/* ── Currently Reading (2×2) ── */}
        {readingBooks.length > 0 ? (
          <BentoCard size="2x2" className="flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <span className="text-label">Leyendo ahora</span>
              {readingBooks.length > 1 && (
                <span className="text-xs text-zinc-600">{readingBooks.length} libros</span>
              )}
            </div>
            <BookStack books={readingBooks} navigate={navigate} />
          </BentoCard>
        ) : (
          <BentoCard size="2x2" className="flex flex-col items-center justify-center gap-3">
            <BookOpen className="w-10 h-10 text-zinc-700" />
            <p className="text-zinc-500 text-sm">Sin libro activo</p>
            <Button size="sm" onClick={() => navigate('/search')}>
              <Plus className="w-3.5 h-3.5" /> Buscar libro
            </Button>
          </BentoCard>
        )}

        {/* ── Streak ── */}
        <BentoCard size="1x1" accent className="flex flex-col justify-between">
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

        {/* ── Reading Time ── */}
        <BentoCard size="1x1" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label">Tiempo total</span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <p className="text-stat">{formatMinutes(stats?.total_minutes ?? 0)}</p>
            <p className="text-xs text-zinc-500 mt-1">en sesiones</p>
          </div>
        </BentoCard>

        {/* ── Books this year ── */}
        <BentoCard size="1x1" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label">Este año</span>
            <BookCheck className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-stat">{stats?.books_this_year ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-1">libros leídos</p>
          </div>
          <p className="text-xs text-zinc-600">{stats?.pages_this_year ?? 0} páginas</p>
        </BentoCard>

        {/* ── Avg Rating ── */}
        <BentoCard size="1x1" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label">Promedio</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-stat">{(stats?.avg_rating ?? 0).toFixed(1)}</p>
            <p className="text-xs text-zinc-500 mt-1">rating</p>
          </div>
          <StarRating value={Math.round(stats?.avg_rating ?? 0)} readOnly size="sm" />
        </BentoCard>

        {/* ── Want to Read ── */}
        <BentoCard size="2x1" className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-label">Por leer</span>
            <button onClick={() => navigate('/library')} className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">
              Ver todos →
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {wantToRead.slice(0, 2).map((ub) => (
              <div key={ub.id} onClick={() => navigate(`/library/${ub.id}`)} className="flex items-center gap-3 cursor-pointer group">
                <BookCover url={ub.book.cover_url} title={ub.book.title} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-amber-400 transition-colors">
                    {ub.book.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{ub.book.author}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 shrink-0" />
              </div>
            ))}
            {wantToRead.length === 0 && (
              <p className="text-sm text-zinc-600">Cola vacía.</p>
            )}
          </div>
        </BentoCard>

        {/* ── Recent Notes — stacked cards ── */}
        <BentoCard size="2x1" className="flex flex-col">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-label">Notas recientes</span>
            {(recentNotes?.length ?? 0) > 1 && (
              <span className="text-xs text-zinc-600">{recentNotes!.length} notas</span>
            )}
          </div>
          {(recentNotes?.length ?? 0) > 0 ? (
            <NoteStack notes={recentNotes!} navigate={navigate} />
          ) : (
            <p className="text-sm text-zinc-600 flex-1 flex items-center">Sin notas aún.</p>
          )}
        </BentoCard>

        {/* ── Recent Sessions ── */}
        <BentoCard size="3x1" className="flex flex-col">
          <span className="text-label mb-4">Sesiones recientes</span>
          {recentSessions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-zinc-400 text-xs tabular-nums w-20 shrink-0">
                    {new Date(s.session_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-zinc-200 truncate flex-1">{firstReading?.book.title}</span>
                  <span className="text-zinc-500 text-xs tabular-nums shrink-0">{s.pages_read} págs</span>
                  {s.duration_minutes && (
                    <span className="text-zinc-600 text-xs tabular-nums shrink-0">{formatMinutes(s.duration_minutes)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Sin sesiones registradas aún.</p>
          )}
        </BentoCard>

        {/* ── Quick Add ── */}
        <BentoCard size="1x1" onClick={() => navigate('/search')} className="flex flex-col items-center justify-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
            <Plus className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100">Agregar libro</p>
        </BentoCard>

      </div>
    </div>
  )
}
