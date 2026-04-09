// En desarrollo: vacío → Vite proxy maneja /api/* → backend local
// En producción: URL completa del backend en Fly.io (ej: https://bookshelf-api.fly.dev)
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function buildHeaders(withUser = true): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (withUser) {
    const userId = localStorage.getItem('bookshelf_user_id')
    if (userId) headers['X-User-Id'] = userId
  }
  return headers
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  withUser = true,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(withUser),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new ApiError(res.status, text)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown, withUser = true) =>
    request<T>('POST', path, body, withUser),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
