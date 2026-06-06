import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { RevealEmail } from './reveal-email'

type AuditAction = {
  id: string
  createdAt: string
  action: string
  actorRole: string
  actorEmail: string | null
  projectId: string | null
  targetType: string | null
  targetId: string | null
  metadata: unknown
  hasEmail: boolean
  emailMasked: string | null
}

export const metadata = {
  title: '操作ログ',
}

// アクション識別子 → 日本語ラベル
const ACTION_LABEL: Record<string, string> = {
  'entry.resend_confirmation': '確認メール再送',
  'entry.reissue_rank_link': '順位リンク再発行',
  'entry.delete': 'エントリ削除',
  'project.create': 'プロジェクト作成',
  'project.update': 'プロジェクト更新',
  'invite_code.create': '招待コード発行',
  'invite_code.update': '招待コード更新',
  'invite_code.soft_delete': '招待コード削除',
  'invite_code.restore': '招待コード復元',
  'invite_request.approve': '申請を承認',
  'invite_request.reject': '申請を却下',
  'audit.reveal_email': '宛先を復号表示',
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })
}

export default async function AuditLogPage() {
  // システム管理者でなければページごと弾く
  const me = await apiJson<{ isAdmin?: boolean }>('/api/v1/auth/me')
  if (!me?.isAdmin) redirect('/projects')

  const data = await apiJson<{ actions: AuditAction[] }>('/api/v1/admin/audit-actions')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/projects"
        className="neo-code text-sm text-neo-fg-soft hover:text-neo-primary mb-4 inline-block"
      >
        ← 自分の開発ダッシュボードへ
      </Link>

      <h1 className="neo-display text-3xl text-neo-fg mb-1">操作ログ 🧾</h1>
      <p className="neo-body text-sm text-neo-fg-soft mb-6">
        開発者・システム管理者の操作の監査記録です。宛先メールは既定でマスク表示し、「表示」で復号します（復号操作も記録されます）。
      </p>

      <div className="bg-neo-card neo-card rounded-2xl overflow-hidden">
        {!data || data.actions.length === 0 ? (
          <div className="p-12 text-center text-neo-fg-soft neo-body text-sm">
            まだ操作ログはありません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neo-surface text-neo-fg-soft border-b-2 border-neo-ink">
              <tr>
                <th className="text-left px-4 py-3 neo-label">日時</th>
                <th className="text-left px-4 py-3 neo-label">操作者</th>
                <th className="text-left px-4 py-3 neo-label">アクション</th>
                <th className="text-left px-4 py-3 neo-label">対象</th>
              </tr>
            </thead>
            <tbody>
              {data.actions.map((a) => (
                <tr key={a.id} className="border-t-2 border-neo-track align-top">
                  <td className="px-4 py-3 neo-code text-xs text-neo-fg-soft whitespace-nowrap">
                    {fmt(a.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="neo-code text-xs text-neo-fg break-all">
                      {a.actorEmail ?? '—'}
                    </div>
                    <span
                      className={`neo-code text-[10px] px-1.5 py-0.5 rounded border ${
                        a.actorRole === 'system_admin'
                          ? 'bg-neo-primary-soft text-neo-primary border-neo-primary'
                          : 'bg-neo-surface text-neo-fg-faint border-neo-track'
                      }`}
                    >
                      {a.actorRole === 'system_admin' ? 'システム管理者' : '開発者'}
                    </span>
                  </td>
                  <td className="px-4 py-3 neo-body text-neo-fg">
                    {ACTION_LABEL[a.action] ?? a.action}
                  </td>
                  <td className="px-4 py-3">
                    {a.hasEmail ? (
                      <RevealEmail id={a.id} masked={a.emailMasked} />
                    ) : (
                      <span className="neo-code text-xs text-neo-fg-faint break-all">
                        {a.targetType ?? '—'}
                        {a.targetId ? `: ${a.targetId.slice(0, 8)}…` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
