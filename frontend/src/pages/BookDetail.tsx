import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, BookOpen, Clock, CalendarDays, Edit2, Loader2, Trash2, X, ChevronDown, Link, BookMarked } from 'lucide-react'
import BookCover from '@/components/book/BookCover'
import StatusBadge from '@/components/book/StatusBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import StarRating from '@/components/ui/StarRating'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { readingProgress, formatDate, formatMinutes, NOTE_COLOR, NOTE_ICON, STATUS_LABEL } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import { libraryApi, sessionsApi, notesApi } from '@/services/books'
import type { NoteType, ReadingStatus } from '@/types'

const NOTE_TABS: Array<{ value: NoteType | 'all'; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'highlight', label: 'Highlights' },
  { value: 'quote', label: 'Citas' },
  { value: 'reflection', label: 'Reflexiones' },
  { value: 'bookmark', label: 'Marcadores' },
]

export default function BookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [noteFilter, setNoteFilter] = useState<NoteType | 'all'>('all')
  const [showPageInput, setShowPageInput] = useState(false)
  const [pageInput, setPageInput] = useState('')
  const [savingPage, setSavingPage] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [sessionForm, setSessionForm] = useState({ start_page: '', end_page: '', duration_minutes: '' })
  const [savingSession, setSavingSession] = useState(false)
  // Note form
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteForm, setNoteForm] = useState<{ content: string; type: NoteType; page_ref: string }>({
    content: '',
    type: 'reflection',
    page_ref: '',
  })
  const [savingNote, setSavingNote] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [showReaderUrlInput, setShowReaderUrlInput] = useState(false)
  const [readerUrlInput, setReaderUrlInput] = useState('')
  const [savingReaderUrl, setSavingReaderUrl] = useState(false)

  const { data: userBook, loading, error, refetch } = useQuery(
    () => libraryApi.getOne(id!),
    [id],
  )
  const { data: sessions, refetch: refetchSessions } = useQuery(
    () => sessionsApi.getForBook(id!),
    [id],
  )
  const { data: notes, refetch: refetchNotes } = useQuery(
    () => notesApi.getForBook(id!),
    [id],
  )

  const handleSavePage = async () => {
    if (!pageInput || !userBook) return
    setSavingPage(true)
    try {
      await libraryApi.updatePage(userBook.id, Number(pageInput))
      refetch()
      setShowPageInput(false)
      setPageInput('')
    } finally {
      setSavingPage(false)
    }
  }

  const handleLogSession = async () => {
    if (!sessionForm.start_page || !sessionForm.end_page || !userBook) return
    setSavingSession(true)
    try {
      await sessionsApi.log(userBook.id, {
        start_page: Number(sessionForm.start_page),
        end_page: Number(sessionForm.end_page),
        duration_minutes: sessionForm.duration_minutes ? Number(sessionForm.duration_minutes) : undefined,
      })
      refetchSessions()
      refetch()
      setShowSessionForm(false)
      setSessionForm({ start_page: '', end_page: '', duration_minutes: '' })
    } finally {
      setSavingSession(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteForm.content.trim() || !userBook) return
    setSavingNote(true)
    try {
      await notesApi.create(userBook.id, {
        content: noteForm.content.trim(),
        type: noteForm.type,
        page_ref: noteForm.page_ref ? Number(noteForm.page_ref) : undefined,
      })
      refetchNotes()
      setNoteForm({ content: '', type: 'reflection', page_ref: '' })
      setShowNoteForm(false)
    } finally {
      setSavingNote(false)
    }
  }

  const handleSaveReaderUrl = async () => {
    if (!userBook) return
    setSavingReaderUrl(true)
    try {
      await libraryApi.patch(userBook.id, { reader_url: readerUrlInput.trim() || null })
      refetch()
      setShowReaderUrlInput(false)
      setReaderUrlInput('')
    } finally {
      setSavingReaderUrl(false)
    }
  }

  const handleStatusChange = async (newStatus: ReadingStatus) => {
    if (!userBook || changingStatus) return
    setChangingStatus(true)
    setShowStatusMenu(false)
    try {
      const patch: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'completed') {
        patch.finished_at = new Date().toISOString().split('T')[0]
      } else if (newStatus === 'reading' && !userBook.started_at) {
        patch.started_at = new Date().toISOString().split('T')[0]
      }
      await libraryApi.patch(userBook.id, patch)
      refetch()
    } finally {
      setChangingStatus(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId)
    try {
      await notesApi.delete(noteId)
      refetchNotes()
    } finally {
      setDeletingNoteId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    )
  }
  if (error || !userBook) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-zinc-500">Libro no encontrado</p>
        <Button variant="ghost" onClick={() => navigate('/library')}>
          <ArrowLeft className="w-4 h-4" /> Biblioteca
        </Button>
      </div>
    )
  }

  const { book } = userBook
  const progress = readingProgress(userBook.current_page, book.total_pages)
  const totalPagesRead = sessions?.reduce((s, r) => s + r.pages_read, 0) ?? 0
  const totalMinutes = sessions?.reduce((s, r) => s + (r.duration_minutes ?? 0), 0) ?? 0
  const filteredNotes = noteFilter === 'all' ? (notes ?? []) : (notes ?? []).filter((n) => n.type === noteFilter)

  return (
    <div className="animate-fade-in max-w-4xl">
      <button onClick={() => navigate('/library')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-100 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Biblioteca
      </button>

      {/* Book header */}
      <div className="bento-card flex flex-col sm:flex-row gap-6 mb-6">
        <BookCover url={book.cover_url} title={book.title} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap mb-2">
            <h1 className="font-serif text-2xl font-semibold text-zinc-100 leading-tight">{book.title}</h1>
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu((p) => !p)}
                disabled={changingStatus}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <StatusBadge status={userBook.status} />
                {changingStatus
                  ? <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                  : <ChevronDown className="w-3 h-3 text-zinc-500" />
                }
              </button>
              {showStatusMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                  <div className="absolute top-full mt-1 left-0 z-20 bg-surface-card border border-surface-border rounded-xl shadow-xl py-1 min-w-[160px]">
                  {(['want_to_read', 'reading', 'paused', 'completed', 'abandoned'] as ReadingStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-surface-hover ${
                        userBook.status === s ? 'text-amber-400' : 'text-zinc-400'
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-zinc-400 mb-1">{book.author}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {book.year && <span className="text-xs text-zinc-500">{book.year}</span>}
            {book.publisher && <span className="text-xs text-zinc-600">· {book.publisher}</span>}
            {book.genre && <Badge className="bg-surface-hover text-zinc-400">{book.genre}</Badge>}
            {book.language && <Badge className="bg-surface-hover text-zinc-400">{book.language}</Badge>}
          </div>
          {book.description && (
            <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 mb-4">{book.description}</p>
          )}
          {book.total_pages && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-zinc-500 mb-2">
                <span>Página {userBook.current_page} de {book.total_pages}</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} className="max-w-sm" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {userBook.started_at && (
              <div className="flex items-center gap-1.5 text-zinc-500">
                <CalendarDays className="w-3.5 h-3.5" />
                Inicio: {formatDate(userBook.started_at)}
              </div>
            )}
            {userBook.finished_at && (
              <div className="flex items-center gap-1.5 text-zinc-500">
                <CalendarDays className="w-3.5 h-3.5" />
                Fin: {formatDate(userBook.finished_at)}
              </div>
            )}
            {userBook.status === 'completed' && (
              <StarRating value={userBook.rating} readOnly />
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Páginas leídas', value: totalPagesRead },
          { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Tiempo total', value: formatMinutes(totalMinutes) },
          { icon: CalendarDays, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Sesiones', value: sessions?.length ?? 0 },
        ].map(({ icon: Icon, color, bg, label, value }) => (
          <div key={label} className="bento-card flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="font-semibold text-zinc-100 tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress actions */}
      {(userBook.status === 'reading' || userBook.status === 'paused') && (
        <div className="bento-card mb-6">
          <p className="text-label mb-3">Actualizar progreso</p>
          {showPageInput ? (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                placeholder={`Página actual (máx ${book.total_pages ?? '?'})`}
                className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50"
                autoFocus
              />
              <Button onClick={handleSavePage} disabled={savingPage}>
                {savingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
              </Button>
              <Button variant="ghost" onClick={() => setShowPageInput(false)}>Cancelar</Button>
            </div>
          ) : showSessionForm ? (
            <div className="flex flex-wrap gap-2 items-end">
              {[
                { key: 'start_page', label: 'Página inicio' },
                { key: 'end_page', label: 'Página fin' },
                { key: 'duration_minutes', label: 'Minutos (opcional)' },
              ].map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <input
                    type="number"
                    value={sessionForm[key as keyof typeof sessionForm]}
                    onChange={(e) => setSessionForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-36 bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50"
                  />
                </div>
              ))}
              <Button onClick={handleLogSession} disabled={savingSession}>
                {savingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar sesión'}
              </Button>
              <Button variant="ghost" onClick={() => setShowSessionForm(false)}>Cancelar</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPageInput(true)}>
                <Edit2 className="w-3.5 h-3.5" /> Actualizar página
              </Button>
              <Button variant="ghost" onClick={() => setShowSessionForm(true)}>
                <Plus className="w-3.5 h-3.5" /> Registrar sesión
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reader URL */}
      <div className="bento-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-amber-400" />
            <p className="text-label">Enlace de lectura</p>
          </div>
          {!showReaderUrlInput && (
            <Button size="sm" variant="ghost" onClick={() => {
              setReaderUrlInput(userBook.reader_url ?? '')
              setShowReaderUrlInput(true)
            }}>
              <Edit2 className="w-3.5 h-3.5" />
              {userBook.reader_url ? 'Cambiar' : 'Agregar enlace'}
            </Button>
          )}
        </div>

        {showReaderUrlInput ? (
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={readerUrlInput}
              onChange={(e) => setReaderUrlInput(e.target.value)}
              placeholder="https://www.gutenberg.org/files/1342/1342-0.txt"
              className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveReaderUrl()}
            />
            <Button onClick={handleSaveReaderUrl} disabled={savingReaderUrl}>
              {savingReaderUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </Button>
            <Button variant="ghost" onClick={() => setShowReaderUrlInput(false)}>Cancelar</Button>
          </div>
        ) : userBook.reader_url ? (
          <div className="flex items-center gap-3">
            <Link className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <a
              href={userBook.reader_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-amber-400 transition-colors truncate flex-1"
            >
              {userBook.reader_url}
            </a>
            <Button onClick={() => navigate(`/library/${id}/read`)}>
              <BookOpen className="w-3.5 h-3.5" /> Leer ahora
            </Button>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            Pega un enlace de Project Gutenberg, Standard Ebooks u otra fuente para leer el libro aquí.
          </p>
        )}
      </div>

      {/* Sessions */}
      {(sessions?.length ?? 0) > 0 && (
        <div className="bento-card mb-6">
          <p className="text-label mb-4">Sesiones de lectura</p>
          <div className="flex flex-col gap-2">
            {sessions!.map((s) => (
              <div key={s.id} className="flex items-center gap-4 py-2.5 border-b border-surface-border last:border-0 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-zinc-500 text-xs tabular-nums w-24 shrink-0">
                  {new Date(s.session_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-zinc-400 flex-1">pp. {s.start_page}–{s.end_page}</span>
                <span className="text-zinc-300 font-medium tabular-nums">{s.pages_read} págs</span>
                {s.duration_minutes && (
                  <span className="text-zinc-600 tabular-nums">{formatMinutes(s.duration_minutes)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bento-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-label">Notas</p>
          {!showNoteForm && (
            <Button size="sm" variant="outline" onClick={() => setShowNoteForm(true)}>
              <Plus className="w-3.5 h-3.5" /> Agregar nota
            </Button>
          )}
        </div>

        {/* Note form */}
        {showNoteForm && (
          <div className="mb-5 p-4 rounded-xl bg-surface border border-surface-border flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Nueva nota</span>
              <button onClick={() => setShowNoteForm(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex gap-1 flex-wrap">
              {(['reflection', 'highlight', 'quote', 'bookmark'] as NoteType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setNoteForm((p) => ({ ...p, type: t }))}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                    noteForm.type === t
                      ? NOTE_COLOR[t]
                      : 'text-zinc-500 bg-surface-hover hover:text-zinc-300'
                  }`}
                >
                  {NOTE_ICON[t]} {t}
                </button>
              ))}
            </div>

            {/* Content */}
            <textarea
              value={noteForm.content}
              onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
              placeholder={
                noteForm.type === 'quote'
                  ? '"Escribe la cita aquí…"'
                  : 'Escribe tu nota aquí…'
              }
              rows={3}
              autoFocus
              className="w-full bg-surface-hover border border-surface-border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 resize-none transition-colors"
            />

            {/* Page ref */}
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={noteForm.page_ref}
                onChange={(e) => setNoteForm((p) => ({ ...p, page_ref: e.target.value }))}
                placeholder="Página (opcional)"
                className="w-40 bg-surface-hover border border-surface-border rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 transition-colors"
              />
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" size="sm" onClick={() => setShowNoteForm(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={savingNote || !noteForm.content.trim()}
                >
                  {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {NOTE_TABS.map((tab) => (
            <button key={tab.value} onClick={() => setNoteFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                noteFilter === tab.value ? 'bg-amber-400/10 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {filteredNotes.length === 0 ? (
          <p className="text-sm text-zinc-600 py-4">Sin notas aún.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredNotes.map((note) => (
              <div key={note.id} className="flex gap-3 p-3 rounded-xl bg-surface border border-surface-border group">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${NOTE_COLOR[note.type]}`}>
                  {NOTE_ICON[note.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${note.type === 'quote' ? 'italic text-zinc-300' : 'text-zinc-300'}`}>
                    {note.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className={NOTE_COLOR[note.type]}>{note.type}</Badge>
                    {note.page_ref && <span className="text-xs text-zinc-600">p. {note.page_ref}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  disabled={deletingNoteId === note.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700 hover:text-red-400 shrink-0 self-start mt-0.5"
                >
                  {deletingNoteId === note.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
