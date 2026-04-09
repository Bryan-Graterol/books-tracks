import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Minus, Plus, AlertCircle, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@/hooks/useQuery'
import { libraryApi } from '@/services/books'

const FONT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl'] as const
const FONT_LABELS = ['S', 'M', 'L', 'XL'] as const
const CHARS_PER_PAGE = 3000

function buildPages(content: string): string[] {
  const paragraphs = content.split(/\n\n+/)
  const pages: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if (current.length + para.length > CHARS_PER_PAGE && current.length > 0) {
      pages.push(current.trim())
      current = para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }
  if (current.trim()) pages.push(current.trim())
  return pages
}

export default function Reader() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [fontIdx, setFontIdx] = useState(1)
  const [page, setPage] = useState(0)

  const { data: book, loading: loadingBook } = useQuery(
    () => libraryApi.getOne(id!),
    [id],
  )
  const { data: reader, loading: loadingContent, error } = useQuery(
    () => libraryApi.getContent(id!),
    [id],
  )

  const pages = reader ? buildPages(reader.content) : []
  const totalPages = pages.length
  const loading = loadingBook || loadingContent

  const goNext = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [totalPages])

  const goPrev = useCallback(() => {
    setPage((p) => Math.max(p - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  // Reset to page 0 when content loads
  useEffect(() => { setPage(0) }, [reader])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate(`/library/${id}`)}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-100 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm text-zinc-300 truncate font-medium">
            {book?.book.title ?? '—'}
          </span>
          {book?.book.author && (
            <span className="text-xs text-zinc-600 truncate hidden sm:block">
              · {book.book.author}
            </span>
          )}
        </div>

        {/* Page counter */}
        {totalPages > 0 && (
          <span className="text-xs text-zinc-600 tabular-nums shrink-0">
            {page + 1} / {totalPages}
          </span>
        )}

        {/* Font size controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setFontIdx((i) => Math.max(0, i - 1))}
            disabled={fontIdx === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-zinc-600 w-5 text-center tabular-nums">
            {FONT_LABELS[fontIdx]}
          </span>
          <button
            onClick={() => setFontIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
            disabled={fontIdx === FONT_SIZES.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex justify-center px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center w-full h-64">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : error || !reader ? (
          <div className="flex flex-col items-center justify-center w-full h-64 gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-zinc-400 text-sm max-w-sm">
              {typeof error === 'object' && error !== null && 'message' in error
                ? String((error as { message: string }).message)
                : 'No se pudo cargar el contenido. Verifica que la URL sea accesible y contenga texto legible.'}
            </p>
            <button
              onClick={() => navigate(`/library/${id}`)}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Volver al libro
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl flex flex-col gap-10">
            <article
              className={`
                ${FONT_SIZES[fontIdx]}
                text-zinc-300
                leading-relaxed
                font-serif
                whitespace-pre-wrap
                break-words
              `}
            >
              {pages[page]}
            </article>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
              <button
                onClick={goPrev}
                disabled={page === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              {/* Progress dots (max 7 visible) */}
              <div className="flex items-center gap-1.5">
                {totalPages <= 7
                  ? Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => { setPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className={`rounded-full transition-all ${
                          i === page
                            ? 'w-4 h-2 bg-amber-400'
                            : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'
                        }`}
                      />
                    ))
                  : (
                    <span className="text-xs text-zinc-600 tabular-nums">
                      Página {page + 1} de {totalPages}
                    </span>
                  )
                }
              </div>

              <button
                onClick={goNext}
                disabled={page === totalPages - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
