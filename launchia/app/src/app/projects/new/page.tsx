import Link from 'next/link'
import { NewProjectForm } from './new-project-form'

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/projects"
        className="text-sm text-fg-soft hover:text-fg mb-4 inline-block"
      >
        ← プロジェクト一覧へ
      </Link>
      <h1 className="text-2xl font-bold text-fg mb-6">新規プロジェクト</h1>
      <div className="bg-card rounded-xl p-6 border border-line">
        <NewProjectForm />
      </div>
    </div>
  )
}
