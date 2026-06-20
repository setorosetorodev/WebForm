import { type NextRequest, NextResponse } from 'next/server'

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? 'http://localhost:8788'

// OTP コード検証のプロキシ。api の verify を呼び、返ってきた Set-Cookie を
// ブラウザへ転送する（fetch POST の Cookie 付与を rewrite 任せにせず明示転送）。
// パターンは ../verify/route.ts（旧 Magic Link 検証）の Cookie 転送を踏襲。
export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const apiRes = await fetch(`${INTERNAL_API_URL}/api/v1/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, code: body.code }),
    cache: 'no-store',
  })

  const data = (await apiRes.json().catch(() => ({}))) as {
    ok?: boolean
    isAdmin?: boolean
    error?: string
  }

  if (!apiRes.ok) {
    return NextResponse.json({ error: data.error ?? 'verify_failed' }, { status: apiRes.status })
  }

  // api から返ってきた Set-Cookie をブラウザに転送（同一オリジン・host-only）
  const setCookieHeader = apiRes.headers.get('set-cookie')
  const res = NextResponse.json({ ok: true, isAdmin: data.isAdmin ?? false })
  if (setCookieHeader) {
    res.headers.set('set-cookie', setCookieHeader)
  }
  return res
}
