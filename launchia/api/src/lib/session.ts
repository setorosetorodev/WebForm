import type { Env } from '../env'

const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60
export const SESSION_COOKIE_NAME = 'launchia_session'

type SessionPayload = {
  userId: string
  exp: number
}

export async function createSessionValue(env: Env, userId: string): Promise<string> {
  const payload: SessionPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  }
  const payloadStr = JSON.stringify(payload)
  const payloadB64 = base64UrlEncodeString(payloadStr)
  const sig = await hmacSha256Base64Url(env.SESSION_SECRET, payloadB64)
  return `${payloadB64}.${sig}`
}

export async function verifySessionValue(
  env: Env,
  cookie: string | undefined,
): Promise<SessionPayload | null> {
  if (!cookie) return null
  const dot = cookie.indexOf('.')
  if (dot < 0) return null
  const payloadB64 = cookie.slice(0, dot)
  const sig = cookie.slice(dot + 1)

  const expectedSig = await hmacSha256Base64Url(env.SESSION_SECRET, payloadB64)
  if (!constantTimeEqual(sig, expectedSig)) return null

  try {
    const payloadStr = base64UrlDecodeString(payloadB64)
    const payload = JSON.parse(payloadStr) as SessionPayload
    const nowSec = Math.floor(Date.now() / 1000)
    if (payload.exp < nowSec) return null
    return payload
  } catch {
    return null
  }
}

export function sessionMaxAge(): number {
  return SESSION_DURATION_SECONDS
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const keyData = new TextEncoder().encode(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const messageData = new TextEncoder().encode(message)
  const sigBuffer = await crypto.subtle.sign('HMAC', key, messageData)
  return base64UrlEncodeBytes(new Uint8Array(sigBuffer))
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlEncodeString(text: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(text))
}

function base64UrlDecodeString(text: string): string {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = (4 - (padded.length % 4)) % 4
  const base64 = padded + '='.repeat(padLen)
  return new TextDecoder().decode(
    Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
  )
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}
