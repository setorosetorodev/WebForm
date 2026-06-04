import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EuStyle } from '../../eu-style'
import { UnsubscribeButton } from './unsubscribe-button'

export const metadata: Metadata = {
  title: '順位確認｜Launchia ウェイトリスト',
}

type RankData = {
  rank: number
  project_name: string
  total_count: number
  just_confirmed: boolean
}

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? 'http://localhost:8788'

async function fetchRank(token: string): Promise<RankData | null> {
  try {
    const res = await fetch(
      `${INTERNAL_API_URL}/api/v1/public/rank/${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    return (await res.json()) as RankData
  } catch {
    return null
  }
}

export default async function RankCheckPage(props: PageProps<'/r/[token]'>) {
  const { token } = await props.params
  const data = await fetchRank(token)
  if (!data) notFound()

  const total = Math.max(data.total_count, data.rank, 1)
  const aheadPct = Math.max(1, Math.round((data.rank / total) * 100)) // 上位 X%
  const fill = Math.max(4, Math.round((1 - (data.rank - 1) / total) * 100)) // 前方ほど満ちる

  return (
    <main className="eu min-h-screen bg-eu-bg flex items-center justify-center p-4">
      <EuStyle />
      <div className="w-full max-w-md">
        {/* 順位リビールカード（登録者の最重要モーメント） */}
        <div className="eu-neo bg-eu-card rounded-3xl p-7 md:p-8 text-center">
          {data.just_confirmed && (
            <span className="eu-neo-sm eu-head bg-eu-chip-bg text-eu-chip-fg inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm">
              🎉 登録完了！
            </span>
          )}
          <div className={`eu-head text-sm text-eu-fg-soft ${data.just_confirmed ? 'mt-5' : ''}`}>
            あなたは現在
          </div>
          <div className="eu-display my-1 text-eu-primary" style={{ fontSize: '72px' }}>
            {data.rank.toLocaleString('ja-JP')}
            <span className="text-eu-fg" style={{ fontSize: '26px' }}> 番目</span>
          </div>
          <div className="eu-head text-eu-fg">{data.project_name} のウェイトリスト</div>

          {/* 立ち位置バー（前方ほど満ちる） */}
          <div className="eu-neo-sm bg-eu-surface mt-6 h-4 w-full rounded-full overflow-hidden">
            <div className="h-full bg-eu-primary-strong" style={{ width: `${fill}%` }} />
          </div>
          <div className="eu-code text-xs mt-2 text-eu-fg-faint">
            総勢 {data.total_count.toLocaleString('ja-JP')} 人中・上位 {aheadPct}%
          </div>

          <p className="eu-body text-sm text-eu-fg-soft mt-6">
            リリースまでもう少しお待ちください。
            <br />
            このページはいつでも順位を確認できます。
          </p>
        </div>

        <div className="mt-5">
          <UnsubscribeButton token={token} />
        </div>

        <div className="eu-code text-xs text-center mt-6 text-eu-fg-faint">
          このページは{' '}
          <a href="https://launchia.net" className="underline hover:text-eu-fg-soft">
            Launchia
          </a>{' '}
          が提供しています
        </div>
      </div>
    </main>
  )
}
