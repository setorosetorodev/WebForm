import Link from 'next/link'
import { apiJson } from '@/lib/api'

type Project = {
  id: string
  slug: string
  name: string
  description: string | null
  embedEnabled: boolean
  ideaPagePublic: boolean
  createdAt: string
}

export default async function ProjectsPage() {
  const data = await apiJson<{ projects: Project[] }>('/api/v1/admin/projects')
  const projects = data?.projects ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">プロジェクト</h1>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg"
        >
          + 新規作成
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-gray-700 font-medium mb-2">
            まだプロジェクトがありません
          </div>
          <div className="text-sm text-gray-500 mb-4">
            最初のプロジェクトを作成してウェイトリストを始めましょう。
          </div>
          <Link
            href="/projects/new"
            className="inline-block text-brand-600 hover:underline text-sm"
          >
            最初のプロジェクトを作成する →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block bg-white rounded-xl p-5 border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="font-bold text-gray-900">{p.name}</h2>
                <div className="flex gap-1.5 text-xs flex-shrink-0">
                  {p.embedEnabled && (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">
                      埋め込み
                    </span>
                  )}
                  {p.ideaPagePublic && (
                    <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded">
                      アイデア公開
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400 font-mono mb-1">slug: {p.slug}</div>
              {p.description && (
                <div className="text-sm text-gray-600 line-clamp-1">
                  {p.description}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
