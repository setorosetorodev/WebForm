const TOKEN_BYTE_LENGTH = 32

export function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTE_LENGTH)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

export async function hashToken(token: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hashBuffer)
}

export async function hashUserAgent(userAgent: string | null | undefined): Promise<Uint8Array | null> {
  if (!userAgent) return null
  const data = new TextEncoder().encode(userAgent)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hashBuffer)
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = ''
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i])
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
