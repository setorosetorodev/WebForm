'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export type CodeOption = {
  id: string
  code: string
  remaining: number
  notes: string | null
}

export function RequestActions({
  requestId,
  codes,
}: {
  requestId: string
  codes: CodeOption[]
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle')
  const [pending, setPending] = useState(false)
  const [codeId, setCodeId] = useState('') // '' = 新規発行
  const [notify, setNotify] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function approve() {
    setPending(true)
    setErrorMessage('')
    try {
      const res = await fetch(`/api/v1/admin/invite-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(codeId ? { code_id: codeId } : {}),
      })
      if (res.ok) router.refresh()
      else setErrorMessage('承認に失敗しました。')
    } catch {
      setErrorMessage('通信エラー')
    } finally {
      setPending(false)
    }
  }

  async function reject() {
    setPending(true)
    setErrorMessage('')
    try {
      const res = await fetch(`/api/v1/admin/invite-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notify }),
      })
      if (res.ok) router.refresh()
      else setErrorMessage('却下に失敗しました。')
    } catch {
      setErrorMessage('通信エラー')
    } finally {
      setPending(false)
    }
  }

  if (mode === 'idle') {
    return (
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setMode('approve')}
          className="neo-btn bg-neo-primary text-neo-on-primary rounded-lg px-3 py-1.5 text-xs"
        >
          招待して返信
        </button>
        <button
          type="button"
          onClick={() => setMode('reject')}
          className="neo-btn bg-neo-card text-neo-fg-soft rounded-lg px-3 py-1.5 text-xs"
        >
          却下
        </button>
      </div>
    )
  }

  if (mode === 'approve') {
    return (
      <div className="bg-neo-surface neo-border-thin rounded-lg p-2.5 flex flex-col gap-2 items-stretch min-w-[15rem]">
        <label className="neo-label text-[11px] text-neo-fg-soft">割り当てるコード</label>
        <select
          value={codeId}
          onChange={(e) => setCodeId(e.target.value)}
          className="neo-input neo-code text-xs py-1.5"
        >
          <option value="">＋ 新規に1回コードを発行</option>
          {codes.map((co) => (
            <option key={co.id} value={co.id}>
              {co.code}（残り{co.remaining}{co.notes ? ` / ${co.notes}` : ''}）
            </option>
          ))}
        </select>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={approve}
            disabled={pending}
            className="neo-btn bg-neo-primary text-neo-on-primary rounded-lg px-3 py-1.5 text-xs"
          >
            {pending ? '…' : '送信'}
          </button>
          <button
            type="button"
            onClick={() => setMode('idle')}
            disabled={pending}
            className="neo-code text-xs text-neo-fg-faint hover:underline px-2"
          >
            やめる
          </button>
        </div>
        {errorMessage && <div className="neo-body text-xs text-neo-danger">{errorMessage}</div>}
      </div>
    )
  }

  // reject
  return (
    <div className="bg-neo-surface neo-border-thin rounded-lg p-2.5 flex flex-col gap-2 items-end">
      <label className="flex items-center gap-1.5 cursor-pointer neo-body text-xs text-neo-fg-soft">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="w-3.5 h-3.5 accent-neo-primary"
        />
        申請者に却下メールを送る
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reject}
          disabled={pending}
          className="neo-btn bg-neo-danger text-neo-on-danger rounded-lg px-3 py-1.5 text-xs"
        >
          {pending ? '…' : '却下を確定'}
        </button>
        <button
          type="button"
          onClick={() => setMode('idle')}
          disabled={pending}
          className="neo-code text-xs text-neo-fg-faint hover:underline px-2"
        >
          やめる
        </button>
      </div>
      {errorMessage && <div className="neo-body text-xs text-neo-danger">{errorMessage}</div>}
    </div>
  )
}
