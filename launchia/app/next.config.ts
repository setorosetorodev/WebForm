import path from 'path'
import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'
const internalApiUrl = process.env.INTERNAL_API_URL ?? 'http://localhost:8788'

const nextConfig: NextConfig = {
  turbopack: {
    // node_modules を junction で OneDrive 外 (C:\dev\...) に逃がしているため、
    // Turbopack のルートをドライブルートまで広げて symlink を許可する。
    // (狭く固定すると「ルート外を指す symlink」エラーになる)
    root: path.parse(__dirname).root,
  },
  async rewrites() {
    if (!isDev) return []
    return [
      {
        source: '/api/:path*',
        destination: `${internalApiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
