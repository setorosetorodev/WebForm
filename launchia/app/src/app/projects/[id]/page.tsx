import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { EditForm } from './edit-form'
import { EmbedInfo } from './embed-info'

type ProjectData = {
  project: {
    id: string
    slug: string
    name: string
    description: string | null
    coverImageUrl: string | null
    landingPageUrl: string | null
    embedEnabled: boolean
    ideaPagePublic: boolean
    requireConsent: boolean
    allowedOrigins: string[]
    createdAt: string
  }
  counts: { total: number; confirmed: number; pending: number }
}

export default async function ProjectDetailPage(props: PageProps<'/projects/[id]'>) {
  const { id } = await props.params
  const data = await apiJson<ProjectData>(`/api/v1/admin/projects/${id}`)
  if (!data) notFound()
  const { project, counts } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/projects"
        className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block"
      >
        ← プロジェクト一覧へ
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.name}</h1>
        <div className="text-xs text-gray-400 font-mono">slug: {project.slug}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-brand-600">{counts.confirmed}</div>
          <div className="text-xs text-gray-500 mt-0.5">確認済み登録</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-amber-600">{counts.pending}</div>
          <div className="text-xs text-gray-500 mt-0.5">確認待ち</div>
        </div>
        <Link
          href={`/projects/${project.id}/entries`}
          className="bg-white rounded-xl p-4 border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all flex flex-col items-center justify-center"
        >
          <div className="text-sm font-semibold text-gray-700">登録者一覧</div>
          <div className="text-xs text-brand-600 mt-1">→ 開く</div>
        </Link>
      </div>

      <EmbedInfo project={project} />

      <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-4">プロジェクト設定</h2>
        <EditForm project={project} />
      </div>
    </div>
  )
}
