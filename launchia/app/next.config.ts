import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'
const internalApiUrl = process.env.INTERNAL_API_URL ?? 'http://localhost:8788'

const nextConfig: NextConfig = {
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
