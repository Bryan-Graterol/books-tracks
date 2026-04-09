import { api } from './api'
import type {
  UserBook,
  ReadingSession,
  Note,
  NoteWithBook,
  BookSearchResult,
  ReadingStats,
  ReadingStatus,
  NoteType,
} from '@/types'

// ── User ─────────────────────────────────────────────────────────────────────

export interface UserPayload { name: string; email: string }
export interface UserResponse {
  id: string
  name: string
  email: string
  created_at: string
  is_admin: boolean
  is_demo: boolean
}
export interface AllowedEmailEntry { id: string; email: string; created_at: string }

export const usersApi = {
  create: (body: UserPayload) =>
    api.post<UserResponse>('/users', body, false),
  getByEmail: (email: string) =>
    api.get<UserResponse>(`/users/by-email/${encodeURIComponent(email)}`),
}

export const adminApi = {
  listUsers: () => api.get<UserResponse[]>('/admin/users'),
  listAllowed: () => api.get<AllowedEmailEntry[]>('/admin/allowed-emails'),
  addAllowed: (email: string) =>
    api.post<AllowedEmailEntry>('/admin/allowed-emails', { email }),
  removeAllowed: (email: string) =>
    api.delete<void>(`/admin/allowed-emails/${encodeURIComponent(email)}`),
}

// ── Book search (external API) ───────────────────────────────────────────────

export const booksApi = {
  search: (query: string, source = 'openlibrary') =>
    api.get<BookSearchResult[]>(
      `/books/search?q=${encodeURIComponent(query)}&source=${source}`,
    ),
}

// ── Library ──────────────────────────────────────────────────────────────────

export interface AddToLibraryPayload {
  source_api: string
  external_id: string
  status: ReadingStatus
  title: string
  author?: string
  year?: number
  cover_url?: string
  isbn?: string
  description?: string
  total_pages?: number
  genre?: string
  publisher?: string
  language?: string
}

export const libraryApi = {
  getAll: (status?: ReadingStatus) =>
    api.get<UserBook[]>(
      status ? `/library?reading_status=${status}` : '/library',
    ),

  getOne: (userBookId: string) =>
    api.get<UserBook>(`/library/${userBookId}`),

  add: (payload: AddToLibraryPayload) =>
    api.post<UserBook>('/library', payload),

  updateStatus: (id: string, status: ReadingStatus) =>
    api.patch<UserBook>(`/library/${id}`, { status }),

  updatePage: (id: string, current_page: number) =>
    api.patch<UserBook>(`/library/${id}`, { current_page }),

  updateRating: (id: string, rating: number) =>
    api.patch<UserBook>(`/library/${id}`, { rating }),

  patch: (id: string, body: Record<string, unknown>) =>
    api.patch<UserBook>(`/library/${id}`, body),

  remove: (id: string) =>
    api.delete<void>(`/library/${id}`),

  getContent: (id: string) =>
    api.get<{ content: string; source_url: string }>(`/library/${id}/content`),
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  getForBook: (userBookId: string) =>
    api.get<ReadingSession[]>(`/library/${userBookId}/sessions`),

  log: (userBookId: string, payload: {
    start_page: number
    end_page: number
    duration_minutes?: number
  }) => api.post<ReadingSession>(`/library/${userBookId}/sessions`, payload),
}

// ── Notes ────────────────────────────────────────────────────────────────────

export const notesApi = {
  getAll: (limit = 10) =>
    api.get<NoteWithBook[]>(`/notes?limit=${limit}`),

  getForBook: (userBookId: string) =>
    api.get<Note[]>(`/library/${userBookId}/notes`),

  create: (userBookId: string, payload: {
    content: string
    type: NoteType
    page_ref?: number
  }) => api.post<Note>(`/library/${userBookId}/notes`, payload),

  update: (noteId: string, content: string) =>
    api.patch<Note>(`/notes/${noteId}`, { content }),

  delete: (noteId: string) =>
    api.delete<void>(`/notes/${noteId}`),
}

// ── Stats ────────────────────────────────────────────────────────────────────

export const statsApi = {
  get: () => api.get<ReadingStats>('/stats'),
}
