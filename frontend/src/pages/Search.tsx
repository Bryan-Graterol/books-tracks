import { useState } from 'react'
import { Search as SearchIcon, Plus, BookOpen, Loader2 } from 'lucide-react'
import BookCover from '@/components/book/BookCover'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { booksApi, libraryApi } from '@/services/books'
import { ApiError } from '@/services/api'
import type { BookSearchResult, ReadingStatus } from '@/types'

const STATUS_OPTIONS: Array<{ value: ReadingStatus; label: string }> = [
  { value: 'want_to_read', label: 'Por leer' },
  { value: 'reading', label: 'Empezar a leer' },
]

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearchError('')
    setResults([])
    try {
      const data = await booksApi.search(query)
      setResults(data)
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Error al buscar')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (book: BookSearchResult, status: ReadingStatus) => {
    setAddingId(book.external_id)
    setAddErrors((prev) => ({ ...prev, [book.external_id]: '' }))
    try {
      await libraryApi.add({
        source_api: book.source_api,
        external_id: book.external_id,
        status,
        title: book.title,
        author: book.author,
        year: book.year,
        cover_url: book.cover_url,
        isbn: book.isbn,
        description: book.description,
        total_pages: book.total_pages,
        genre: book.genre,
        publisher: book.publisher,
        language: book.language,
      })
      setAddedIds((prev) => new Set(prev).add(book.external_id))
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 409
        ? 'Ya está en tu biblioteca'
        : (err instanceof Error ? err.message : 'Error al agregar')
      setAddErrors((prev) => ({ ...prev, [book.external_id]: msg }))
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Buscar libro</h1>
        <p className="text-zinc-500 text-sm mt-1">Busca por título o autor para agregar a tu biblioteca.</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Título, autor, ISBN…"
            className="w-full bg-surface-card border border-surface-border rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 transition-colors"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
        </Button>
      </form>

      {/* States */}
      {searchError && <p className="text-red-400 text-sm mb-4">{searchError}</p>}

      {!loading && results.length === 0 && query === '' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-zinc-600" />
          </div>
          <div>
            <p className="text-zinc-400 font-medium">Busca tu próxima lectura</p>
            <p className="text-sm text-zinc-600 mt-1">Resultados desde Open Library</p>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && query !== '' && !searchError && (
        <p className="text-center text-zinc-500 py-12">Sin resultados para "{query}"</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-600 mb-1">{results.length} resultados</p>
          {results.map((book) => {
            const isAdded = addedIds.has(book.external_id)
            const isAdding = addingId === book.external_id
            const addError = addErrors[book.external_id]

            return (
              <div key={book.external_id} className="bento-card flex flex-col sm:flex-row items-start gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <BookCover url={book.cover_url} title={book.title} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-100 mb-0.5 line-clamp-1">{book.title}</h3>
                    <p className="text-sm text-zinc-500 mb-2">{book.author}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {book.year && <Badge className="bg-surface-hover text-zinc-500">{book.year}</Badge>}
                      {book.genre && <Badge className="bg-surface-hover text-zinc-500">{book.genre}</Badge>}
                      {book.total_pages && <Badge className="bg-surface-hover text-zinc-500">{book.total_pages} págs</Badge>}
                    </div>
                    {book.description && (
                      <p className="text-xs text-zinc-600 line-clamp-2">{book.description}</p>
                    )}
                    {addError && <p className="text-xs text-amber-400 mt-1">{addError}</p>}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  {isAdded ? (
                    <span className="text-xs text-green-400 font-medium px-3 py-1.5">Agregado ✓</span>
                  ) : (
                    STATUS_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        size="sm"
                        variant={opt.value === 'reading' ? 'primary' : 'outline'}
                        disabled={isAdding}
                        onClick={() => handleAdd(book, opt.value)}
                      >
                        {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        {opt.label}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
