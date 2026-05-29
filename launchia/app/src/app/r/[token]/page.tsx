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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        {data.just_confirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-sm font-bold text-green-800">登録が完了しました！</div>
            <div className="text-xs text-green-700 mt-1">
              ウェイトリストへの参加が確定しました。
            </div>
          </div>
        )}

        <div className="text-sm font-semibold text-gray-700">{data.project_name}</div>
        <div className="text-xs text-gray-400 mt-1 mb-6">ウェイトリストの順位確認</div>

        <div className="bg-blue-50 rounded-xl py-8 px-4 text-center mb-6">
          <div className="text-xs text-gray-600 mb-2">現在の順位</div>
          <div>
            <span className="text-6xl font-extrabold text-blue-600">{data.rank}</span>
            <span className="text-2xl font-semibold text-blue-600 ml-1">番目</span>
          </div>
          <div className="text-xs text-gray-500 mt-3">総登録者 {data.total_count} 人中</div>
        </div>

        <p className="text-sm text-gray-600 text-center mb-8 leading-relaxed">
          リリースまでもう少しお待ちください。
          <br />
          このページは何度でも確認できます。
        </p>

        <UnsubscribeButton token={token} />

        <div className="text-xs text-gray-400 text-center mt-8">
          このページは{' '}
          <a href="https://launchia.net" className="text-gray-500 hover:underline">
            Launchia
          </a>{' '}
          が提供しています
        </div>
      </div>
    </main>
  )
}
