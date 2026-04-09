// ─── Enums (mirror DB) ──────────────────────────────────────────────────────

export type ReadingStatus =
  | 'want_to_read'
  | 'reading'
  | 'paused'
  | 'completed'
  | 'abandoned'

export type NoteType = 'highlight' | 'quote' | 'reflection' | 'bookmark'

// ─── Core entities ──────────────────────────────────────────────────────────

export interface Book {
  id: string
  isbn?: string
  title: string
  author?: string
  publisher?: string
  year?: number
  genre?: string
  language?: string
  cover_url?: string
  description?: string
  total_pages?: number
  source_api?: string
  external_id?: string
}

export interface UserBook {
  id: string
  user_id: string
  book_id: string
  book: Book
  status: ReadingStatus
  current_page: number
  rating?: number       // 1–5
  started_at?: string   // ISO date
  finished_at?: string
  reader_url?: string
  added_at: string
}

export interface ReadingSession {
  id: string
  user_book_id: string
  start_page: number
  end_page: number
  pages_read: number    // generated (end - start)
  duration_minutes?: number
  session_date: string  // ISO timestamp
}

export interface Note {
  id: string
  user_book_id: string
  content: string
  page_ref?: number
  type: NoteType
  created_at: string
  updated_at: string
}

export interface NoteWithBook extends Note {
  book_title: string
}

// ─── API / search ───────────────────────────────────────────────────────────

export interface BookSearchResult {
  title: string
  author: string
  year?: number
  cover_url?: string
  isbn?: string
  description?: string
  total_pages?: number
  genre?: string
  publisher?: string
  language?: string
  source_api: string
  external_id: string
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export interface ReadingStats {
  total_books: number
  total_completed: number
  books_this_year: number
  books_this_month: number
  pages_this_year: number
  avg_rating: number
  current_streak: number   // days
  longest_streak: number
  total_minutes: number
  by_status: Record<ReadingStatus, number>
  by_genre: Array<{ genre: string; count: number }>
  monthly_pages: Array<{ month: string; pages: number }>
}

// ─── UI helpers ─────────────────────────────────────────────────────────────

export type BentoSize =
  | '1x1'   // col-span-1 row-span-1
  | '2x1'   // col-span-2 row-span-1
  | '1x2'   // col-span-1 row-span-2
  | '2x2'   // col-span-2 row-span-2
  | '3x1'   // col-span-3 row-span-1
  | '4x1'   // col-span-4 row-span-1
