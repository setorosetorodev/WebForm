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
  const [launchTargetDate, setLaunchTargetDate] = useState('')
  const [goalCount, setGoalCount] = useState('')
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
          launch_target_date: launchTargetDate || null,
          goal_count: goalCount ? Number(goalCount) : null,
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
        <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
          プロジェクト名 <span className="text-neo-danger">*</span>
        </label>
        <input
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: だすね"
          className="neo-input"
        />
      </div>

      <div>
        <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
          slug <span className="text-neo-danger">*</span>
          <span className="neo-body text-xs text-neo-fg-faint font-normal ml-2">
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
          className="neo-input neo-code text-sm"
        />
      </div>

      <div>
        <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
          説明文 <span className="neo-body text-xs text-neo-fg-faint font-normal">(任意)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="プロジェクトの説明..."
          className="neo-input"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
            リリース予定日 <span className="neo-body text-xs text-neo-fg-faint font-normal">(任意)</span>
          </label>
          <input
            type="date"
            value={launchTargetDate}
            onChange={(e) => setLaunchTargetDate(e.target.value)}
            className="neo-input"
          />
          <p className="neo-body text-xs text-neo-fg-faint mt-1">カウントダウンに使います。</p>
        </div>
        <div>
          <label className="neo-label block text-sm text-neo-fg-soft mb-1.5">
            目標登録数 <span className="neo-body text-xs text-neo-fg-faint font-normal">(任意)</span>
          </label>
          <input
            type="number"
            min={1}
            value={goalCount}
            onChange={(e) => setGoalCount(e.target.value)}
            placeholder="例: 1000"
            className="neo-input"
          />
          <p className="neo-body text-xs text-neo-fg-faint mt-1">進捗バー・達成度に使います。</p>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ideaPagePublic}
            onChange={(e) => setIdeaPagePublic(e.target.checked)}
            className="w-4 h-4 accent-neo-primary"
          />
          <span className="neo-body text-sm text-neo-fg-soft">
            アイデアページを公開する{' '}
            <span className="neo-code text-xs text-neo-fg-faint">
              (launchia.net/p/{slug || 'slug'})
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={embedEnabled}
            onChange={(e) => setEmbedEnabled(e.target.checked)}
            className="w-4 h-4 accent-neo-primary"
          />
          <span className="neo-body text-sm text-neo-fg-soft">埋め込みウィジェットを有効にする</span>
        </label>
      </div>

      {errorMessage && (
        <div className="bg-neo-danger-soft border-2 border-neo-danger rounded-xl p-3 neo-body text-sm text-neo-danger">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="neo-btn w-full bg-neo-primary text-neo-on-primary rounded-xl py-3"
      >
        {pending ? '作成中...' : 'プロジェクトを作成'}
      </button>
    </form>
  )
}
