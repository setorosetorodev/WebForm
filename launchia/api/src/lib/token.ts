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

const OTP_RANGE = 1_000_000 // 000000–999999

/**
 * 6 桁の OTP コードを CSPRNG で生成（ゼロ埋め）。
 * 剰余バイアスを避けるため、範囲外の乱数は棄却する（rejection sampling）。
 */
export function generateOtpCode(): string {
  // 0xffffffff を OTP_RANGE で割り切れる最大値。これ以上は棄却して一様性を保つ。
  const limit = Math.floor(0xffffffff / OTP_RANGE) * OTP_RANGE
  const buf = new Uint32Array(1)
  let n: number
  do {
    crypto.getRandomValues(buf)
    n = buf[0]
  } while (n >= limit)
  return (n % OTP_RANGE).toString().padStart(6, '0')
}

/**
 * OTP コードを保存用にハッシュ化する。
 * 6 桁は低エントロピー（10^6）ゆえ素の SHA-256 だと DB 漏洩時に即逆算できる。
 * サーバ秘密（SESSION_SECRET）で HMAC し、宛先 email にもバインドする
 * （= 別 email の行に同じコードを使い回せない）。
 */
export async function hashOtpCode(
  secret: string,
  email: string,
  code: string,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const message = new TextEncoder().encode(`${email}:${code}`)
  const sig = await crypto.subtle.sign('HMAC', key, message)
  return new Uint8Array(sig)
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
