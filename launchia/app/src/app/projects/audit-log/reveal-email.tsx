'use client'

import { useState } from 'react'

// 宛先メールの復号表示（明示操作）。既定はマスク、押したときだけ平文を取得する。
export function RevealEmail({ id, masked }: { id: string; masked: string | null }) {
  const [revealed, setRevealed] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [err, setErr] = useState(false)

  async function reveal() {
    setPending(true)
    setErr(false)
    const res = await fetch(`/api/v1/admin/audit-actions/${id}/reveal`, { method: 'POST' })
    setPending(false)
    if (res.ok) {
      const data = (await res.json()) as { email?: string }
      setRevealed(data.email ?? null)
    } else {
      setErr(true)
    }
  }

  if (revealed) {
    return <span className="neo-code text-xs text-neo-fg break-all">{revealed}</span>
  }

  return (
    <span className="neo-code text-xs text-neo-fg-soft inline-flex items-center gap-2">
      <span>{masked ?? '🔒'}</span>
      <button
        type="button"
        onClick={reveal}
        disabled={pending}
        className="text-neo-primary hover:underline disabled:opacity-50"
      >
        {pending ? '…' : '表示'}
      </button>
      {err && <span className="text-neo-danger">失敗</span>}
    </span>
  )
}
