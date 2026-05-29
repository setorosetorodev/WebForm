import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { LogoutButton } from './logout-button'

export const metadata: Metadata = {
  title: {
    template: '%s｜Launchia 管理画面',
    default: 'Launchia 管理画面',
  },
}

type Me = { user: { id: string; email: string } }

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const me = await apiJson<Me>('/api/v1/auth/me')
  if (!me) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/projects" className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">Launchia</span>
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
              管理画面
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 hidden sm:inline">{me.user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
