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

export function EntryRow({
  entry,
  projectId,
}: {
  entry: Entry
  projectId: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function remove() {
    if (!confirm(`${entry.email} を削除しますか？`)) return
    setPending(true)
    const res = await fetch(`/api/v1/admin/projects/${projectId}/entries/${entry.id}`, {
      method: 'DELETE',
    })
    if (res.ok) router.refresh()
    else setPending(false)
  }

  const dt = new Date(entry.createdAt).toLocaleString('ja-JP', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

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
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="neo-code text-xs text-neo-danger hover:underline disabled:opacity-50"
        >
          削除
        </button>
      </td>
    </tr>
  )
}
