'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/** 招待コードのメモをその場で編集（後から「夏のキャンペーン用」等を書ける）。 */
export function CodeNotes({ codeId, notes }: { codeId: string; notes: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(notes ?? '')
  const [pending, setPending] = useState(false)

  async function save() {
    setPending(true)
    try {
      const res = await fetch(`/api/v1/admin/invite-codes/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value }),
      })
      if (res.ok) {
        setEditing(false)
        router.refresh()
      }
    } finally {
      setPending(false)
    }
  }

  if (!editing) {
    // 鉛筆だけがリンク（押下で編集）。メモ本文はただのテキスト。空なら鉛筆のみ。
    return (
      <span className="inline-flex items-baseline gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 leading-none text-neo-primary hover:text-neo-primary-strong cursor-pointer"
          title="メモを編集"
          aria-label="メモを編集"
        >
          ✏️
        </button>
        {notes && <span className="neo-body text-neo-fg-soft break-all">{notes}</span>}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        maxLength={500}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') {
            setEditing(false)
            setValue(notes ?? '')
          }
        }}
        className="neo-input neo-body text-xs py-1 px-2"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="neo-btn bg-neo-primary text-neo-on-primary rounded-md px-2 py-1 text-[11px]"
      >
        保存
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false)
          setValue(notes ?? '')
        }}
        className="neo-code text-[11px] text-neo-fg-faint hover:underline px-1"
      >
        ×
      </button>
    </div>
  )
}
