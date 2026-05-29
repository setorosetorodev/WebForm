import Link from 'next/link'
import { NewProjectForm } from './new-project-form'

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/projects"
        className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block"
      >
        ← プロジェクト一覧へ
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">新規プロジェクト</h1>
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <NewProjectForm />
      </div>
    </div>
  )
}
