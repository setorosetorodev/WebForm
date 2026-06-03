'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CodeActions({
  codeId,
  code,
  maxUses,
  deleted,
}: {
  codeId: string
  code: string
  maxUses: number
  deleted?: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function restore() {
    setPending(true)
    try {
      const res = await fetch(`/api/v1/admin/invite-codes/${codeId}/restore`, { method: 'POST' })
      if (res.ok) router.refresh()
      else setPending(false)
    } catch {
      setPending(false)
    }
  }

  async function changeMax(delta: number) {
    const next = Math.max(1, maxUses + delta)
    if (next === maxUses) return
    setPending(true)
    try {
      const res = await fetch(`/api/v1/admin/invite-codes/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_uses: next }),
      })
      if (res.ok) router.refresh()
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    if (!confirm(`招待コード ${code} を削除しますか？\n（このコードで登録済みのユーザーは消えません）`)) return
    setPending(true)
    try {
      const res = await fetch(`/api/v1/admin/invite-codes/${codeId}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
      else setPending(false)
    } catch {
      setPending(false)
    }
  }

  if (deleted) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={restore}
          disabled={pending}
          className="neo-btn bg-neo-card text-neo-primary rounded-lg px-2.5 py-1 text-xs"
        >
          復元
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-1.5 justify-end items-center">
      <button
        type="button"
        onClick={() => changeMax(-1)}
        disabled={pending || maxUses <= 1}
        title="使用上限を -1"
        className="neo-btn bg-neo-card text-neo-fg rounded-lg px-2.5 py-1 text-xs disabled:opacity-40"
      >
        −1
      </button>
      <button
        type="button"
        onClick={() => changeMax(1)}
        disabled={pending}
        title="使用上限を +1"
        className="neo-btn bg-neo-card text-neo-fg rounded-lg px-2.5 py-1 text-xs"
      >
        +1
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="neo-btn bg-neo-card text-neo-danger rounded-lg px-2.5 py-1 text-xs"
      >
        削除
      </button>
    </div>
  )
}
