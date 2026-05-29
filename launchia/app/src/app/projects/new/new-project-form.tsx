'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export function NewProjectForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [ideaPagePublic, setIdeaPagePublic] = useState(false)
  const [embedEnabled, setEmbedEnabled] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage('')
    setPending(true)

    try {
      const res = await fetch('/api/v1/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          idea_page_public: ideaPagePublic,
          embed_enabled: embedEnabled,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        project?: { id: string }
        error?: string
      }

      if (res.status === 201 && data.project) {
        router.push(`/projects/${data.project.id}`)
      } else if (res.status === 409) {
        setErrorMessage(`slug "${slug}" は既に使われています。別の値を試してください。`)
      } else if (data.error === 'validation_failed') {
        setErrorMessage(
          '入力内容に誤りがあります。slug は 2 文字以上、小文字英数とハイフンのみ使えます。',
        )
      } else {
        setErrorMessage('作成に失敗しました。')
      }
    } catch {
      setErrorMessage('通信エラーが発生しました。')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          プロジェクト名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: だすね"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          slug <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 font-normal ml-2">
            URL の一部 (例: launchia.net/p/dasune)
          </span>
        </label>
        <input
          type="text"
          required
          minLength={2}
          maxLength={40}
          pattern="[a-z0-9-]+"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="例: dasune"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          説明文 <span className="text-xs text-gray-500 font-normal">(任意)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="プロジェクトの説明..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ideaPagePublic}
            onChange={(e) => setIdeaPagePublic(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-sm text-gray-700">
            アイデアページを公開する{' '}
            <span className="text-xs text-gray-500">
              (launchia.net/p/{slug || 'slug'})
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={embedEnabled}
            onChange={(e) => setEmbedEnabled(e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-sm text-gray-700">埋め込みウィジェットを有効にする</span>
        </label>
      </div>

      {errorMessage && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? '作成中...' : 'プロジェクトを作成'}
      </button>
    </form>
  )
}
