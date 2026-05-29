import { type NextRequest, NextResponse } from 'next/server'

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? 'http://localhost:8788'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
  }

  const apiRes = await fetch(
    `${INTERNAL_API_URL}/api/v1/auth/verify?token=${encodeURIComponent(token)}`,
    { method: 'GET', cache: 'no-store' },
  )

  if (!apiRes.ok) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
  }

  // API から返ってきた Set-Cookie をブラウザに転送
  const setCookieHeader = apiRes.headers.get('set-cookie')

  const redirect = NextResponse.redirect(new URL('/projects', request.url))
  if (setCookieHeader) {
    redirect.headers.set('set-cookie', setCookieHeader)
  }
  return redirect
}
