'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export function IssueCodeForm() {
  const router = useRouter()
  const [maxUses, setMaxUses] = useState('1')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(false)
  const [issued, setIssued] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setErrorMessage('')
    setIssued(null)

    try {
      const res = await fetch('/api/v1/admin/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_uses: maxUses ? Number(maxUses) : 1,
          expires_at: expiresAt || null,
          notes: notes || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        code?: { code: string }
        error?: string
      }

      if (res.status === 201 && data.code) {
        setIssued(data.code.code)
        setNotes('')
        setExpiresAt('')
        router.refresh()
      } else if (res.status === 403) {
        setErrorMessage('権限がありません（運営者のみ）。')
      } else {
        setErrorMessage('発行に失敗しました。')
      }
    } catch {
      setErrorMessage('通信エラーが発生しました。')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="neo-label text-xs text-neo-fg-soft mb-1 block">使用上限</label>
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="neo-input"
          />
        </div>
        <div>
          <label className="neo-label text-xs text-neo-fg-soft mb-1 block">
            有効期限 <span className="text-neo-fg-faint font-normal">(空=無期限)</span>
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="neo-input"
          />
          <p className="neo-body text-[11px] text-neo-fg-faint mt-1">指定日の終わり（JST）まで有効。</p>
        </div>
      </div>

      <div>
        <label className="neo-label text-xs text-neo-fg-soft mb-1 block">
          メモ <span className="text-neo-fg-faint font-normal">(任意・後から編集可)</span>
        </label>
        <input
          type="text"
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="例: 夏のキャンペーン用 / Twitter 経由"
          className="neo-input"
        />
      </div>

      {errorMessage && (
        <div className="bg-neo-danger-soft border-2 border-neo-danger rounded-xl p-2.5 neo-body text-sm text-neo-danger">
          {errorMessage}
        </div>
      )}
      {issued && (
        <div className="bg-neo-green-soft border-2 border-neo-green rounded-xl p-3 neo-code text-sm text-neo-on-green-soft">
          発行しました: <strong>{issued}</strong>（下の一覧にも追加されました）
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="neo-btn bg-neo-primary text-neo-on-primary rounded-xl px-5 py-2.5 text-sm"
      >
        {pending ? '発行中...' : '招待コードを発行'}
      </button>
    </form>
  )
}
