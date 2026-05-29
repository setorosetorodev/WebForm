import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { EntryRow } from './entry-row'

type EntriesData = {
  entries: Array<{
    id: string
    email: string
    source: string
    position: number
    rankInList: number
    confirmedAt: string | null
    consentAt: string | null
    createdAt: string
  }>
  counts: { total: number; confirmed: number; pending: number }
  project: { id: string; name: string; slug: string }
  pagination: { limit: number; offset: number }
}

export default async function EntriesPage(props: PageProps<'/projects/[id]/entries'>) {
  const { id } = await props.params
  const data = await apiJson<EntriesData>(`/api/v1/admin/projects/${id}/entries`)
  if (!data) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href={`/projects/${id}`}
        className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block"
      >
        ← {data.project.name}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">登録者一覧</h1>
      <div className="text-sm text-gray-500 mb-6">
        合計 {data.counts.total} 人（確認済み {data.counts.confirmed} / 確認待ち{' '}
        {data.counts.pending}）
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {data.entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            登録者がいません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">メールアドレス</th>
                <th className="text-left px-4 py-3 font-medium">流入元</th>
                <th className="text-left px-4 py-3 font-medium">状態</th>
                <th className="text-left px-4 py-3 font-medium">登録日</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e) => (
                <EntryRow key={e.id} entry={e} projectId={id} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
