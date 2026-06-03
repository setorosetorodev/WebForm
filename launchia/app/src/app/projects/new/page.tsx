import Link from 'next/link'
import { NewProjectForm } from './new-project-form'

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/projects"
        className="neo-code text-sm text-neo-fg-soft hover:text-neo-primary mb-4 inline-block"
      >
        ← プロジェクト一覧へ
      </Link>
      <h1 className="neo-display text-3xl text-neo-fg mb-6">新規プロジェクト</h1>
      <div className="bg-neo-card neo-card rounded-2xl p-6">
        <NewProjectForm />
      </div>
    </div>
  )
}
