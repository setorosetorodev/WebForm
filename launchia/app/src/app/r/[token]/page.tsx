import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
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

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-lg max-w-md w-full p-8">
        {data.just_confirmed && (
          <div className="bg-success-soft border border-success rounded-lg p-4 mb-6 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-sm font-bold text-success">登録が完了しました！</div>
            <div className="text-xs text-success mt-1">
              ウェイトリストへの参加が確定しました。
            </div>
          </div>
        )}

        <div className="text-sm font-semibold text-fg-soft">{data.project_name}</div>
        <div className="text-xs text-fg-faint mt-1 mb-6">ウェイトリストの順位確認</div>

        <div className="bg-primary-soft rounded-xl py-8 px-4 text-center mb-6">
          <div className="text-xs text-fg-soft mb-2">現在の順位</div>
          <div>
            <span className="text-6xl font-extrabold text-primary">{data.rank}</span>
            <span className="text-2xl font-semibold text-primary ml-1">番目</span>
          </div>
          <div className="text-xs text-fg-soft mt-3">総登録者 {data.total_count} 人中</div>
        </div>

        <p className="text-sm text-fg-soft text-center mb-8 leading-relaxed">
          リリースまでもう少しお待ちください。
          <br />
          このページは何度でも確認できます。
        </p>

        <UnsubscribeButton token={token} />

        <div className="text-xs text-fg-faint text-center mt-8">
          このページは{' '}
          <a href="https://launchia.net" className="text-fg-soft hover:underline">
            Launchia
          </a>{' '}
          が提供しています
        </div>
      </div>
    </main>
  )
}
