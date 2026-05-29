import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

// 本番 api（Cloudflare Workers）。ビルド時に rewrites の転送先として埋め込む。
const PROD_API_URL = 'https://launchia-api.setorosetorodev.workers.dev'
const isDev = process.env.NODE_ENV !== 'production'
const internalApiUrl =
  process.env.INTERNAL_API_URL ?? (isDev ? 'http://localhost:8788' : PROD_API_URL)

const nextConfig: NextConfig = {
  // OpenNext を --skipNextBuild で使うため、standalone 出力を明示する
  // (通常は OpenNext が自動注入するが、自前 next build では自分で指定が必要)
  output: 'standalone',
  async rewrites() {
    // dev・本番ともに /api/* を api Worker へ転送（same-origin を維持）
    return [
      {
        source: '/api/:path*',
        destination: `${internalApiUrl}/api/:path*`,
      },
    ]
  },
}

// OpenNext: next dev 時に Cloudflare バインディングをエミュレートする
initOpenNextCloudflareForDev()

export default nextConfig
