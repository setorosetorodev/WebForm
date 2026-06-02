import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { AdminChrome } from './admin-chrome'
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
    <AdminChrome email={me.user.email} actions={<LogoutButton />}>
      {children}
    </AdminChrome>
  )
}
