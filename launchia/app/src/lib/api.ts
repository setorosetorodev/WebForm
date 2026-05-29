import { cookies } from 'next/headers'

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? 'http://localhost:8788'

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies()
  const session = cookieStore.get('launchia_session')
  const headers = new Headers(init?.headers)
  if (session) headers.set('Cookie', `launchia_session=${session.value}`)
  return fetch(`${INTERNAL_API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  })
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await apiFetch(path, init)
  if (!res.ok) return null
  return (await res.json()) as T
}
