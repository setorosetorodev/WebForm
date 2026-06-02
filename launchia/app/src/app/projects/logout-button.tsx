'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="neo-btn lhx-btn bg-[var(--lh-primary)] text-[color:var(--lh-on-primary)] px-6 py-3 neo-border rounded-xl shadow-[4px_4px_0px_0px_var(--lh-ink)] hover:shadow-[6px_6px_0px_0px_var(--lh-ink)] disabled:opacity-50"
    >
      ログアウト
    </button>
  )
}
