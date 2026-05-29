import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { LogoutButton } from './logout-button'

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
          <Link href="/projects" className="text-base font-bold text-gray-900">
            Launchia
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
