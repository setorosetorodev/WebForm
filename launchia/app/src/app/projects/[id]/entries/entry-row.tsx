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
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-gray-500">{entry.rankInList}</td>
      <td className="px-4 py-3 font-mono text-gray-900">{entry.email}</td>
      <td className="px-4 py-3 text-xs text-gray-500">{entry.source}</td>
      <td className="px-4 py-3">
        {entry.confirmedAt ? (
          <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">
            確認済み
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">
            確認待ち
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{dt}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          削除
        </button>
      </td>
    </tr>
  )
}
