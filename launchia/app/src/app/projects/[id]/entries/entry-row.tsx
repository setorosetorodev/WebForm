'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Entry = {
  id: string
  email: string
  source: string
  rankInList: number
  confirmedAt: string | null
  createdAt: string
}

type Pending = null | 'resend' | 'reissue' | 'delete'
type Msg = { kind: 'ok' | 'err'; text: string } | null

export function EntryRow({
  entry,
  projectId,
}: {
  entry: Entry
  projectId: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState<Pending>(null)
  const [msg, setMsg] = useState<Msg>(null)

  async function remove() {
    if (!confirm(`${entry.email} を削除しますか？`)) return
    setPending('delete')
    setMsg(null)
    const res = await fetch(`/api/v1/admin/projects/${projectId}/entries/${entry.id}`, {
      method: 'DELETE',
    })
    if (res.ok) router.refresh()
    else {
      setPending(null)
      setMsg({ kind: 'err', text: '削除に失敗しました' })
    }
  }

  // 確認メール再送（未確認）/ 順位リンク再発行（確認済み）。どちらも宛先メールへ再送する。
  async function reprocess(kind: 'resend' | 'reissue') {
    const label = kind === 'resend' ? '確認メールを再送' : '順位リンクを再発行'
    if (!confirm(`${entry.email} に${label}しますか？\n（これまでのリンクは無効になります）`)) return
    setPending(kind)
    setMsg(null)
    const action = kind === 'resend' ? 'resend-confirmation' : 'reissue-rank-link'
    const res = await fetch(
      `/api/v1/admin/projects/${projectId}/entries/${entry.id}/${action}`,
      { method: 'POST' },
    )
    setPending(null)
    if (res.ok) {
      setMsg({
        kind: 'ok',
        text: kind === 'resend' ? '確認メールを再送しました' : '順位リンクを再発行しました',
      })
      router.refresh()
    } else if (res.status === 429) {
      setMsg({ kind: 'err', text: '少し時間をおいて再試行してください' })
    } else if (res.status === 502) {
      setMsg({ kind: 'err', text: 'メール送信に失敗しました' })
    } else {
      setMsg({ kind: 'err', text: '処理に失敗しました' })
    }
  }

  const dt = new Date(entry.createdAt).toLocaleString('ja-JP', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
  const busy = pending !== null

  return (
    <tr className="border-t-2 border-neo-track hover:bg-neo-surface">
      <td className="px-4 py-3 neo-code text-neo-fg-soft">{entry.rankInList}</td>
      <td className="px-4 py-3 neo-code text-neo-fg">{entry.email}</td>
      <td className="px-4 py-3 neo-body text-xs text-neo-fg-soft">{entry.source}</td>
      <td className="px-4 py-3">
        {entry.confirmedAt ? (
          <span className="neo-code text-xs px-2 py-0.5 bg-neo-green-soft text-neo-on-green-soft border-2 border-neo-green rounded-md">
            確認済み
          </span>
        ) : (
          <span className="neo-code text-xs px-2 py-0.5 bg-neo-orange-soft text-neo-on-orange-soft border-2 border-neo-orange rounded-md">
            確認待ち
          </span>
        )}
      </td>
      <td className="px-4 py-3 neo-code text-xs text-neo-fg-soft">{dt}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-3 justify-end">
            {entry.confirmedAt ? (
              <button
                type="button"
                onClick={() => reprocess('reissue')}
                disabled={busy}
                className="neo-code text-xs text-neo-primary hover:underline disabled:opacity-50"
              >
                {pending === 'reissue' ? '送信中…' : '順位リンク再発行'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => reprocess('resend')}
                disabled={busy}
                className="neo-code text-xs text-neo-primary hover:underline disabled:opacity-50"
              >
                {pending === 'resend' ? '送信中…' : '確認メール再送'}
              </button>
            )}
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="neo-code text-xs text-neo-danger hover:underline disabled:opacity-50"
            >
              削除
            </button>
          </div>
          {msg && (
            <span
              className={`neo-code text-xs ${msg.kind === 'ok' ? 'text-neo-green' : 'text-neo-danger'}`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}
