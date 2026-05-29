import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// 最小構成。R2 によるインクリメンタルキャッシュは Phase 2 で検討。
export default defineCloudflareConfig({})
