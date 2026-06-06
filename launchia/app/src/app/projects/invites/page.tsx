import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { IssueCodeForm } from './issue-code-form'
import { RequestActions } from './request-actions'
import { CodeActions } from './code-actions'
import { CodeNotes } from './code-notes'

type InviteRequest = {
  id: string
  email: string
  name: string | null
  projectName: string | null
  url: string | null
  message: string | null
  status: string
  issuedCode: string | null
  handledAt: string | null
  createdAt: string
}

type InviteCode = {
  id: string
  code: string
  maxUses: number
  usedCount: number
  expiresAt: string | null
  notes: string | null
  deletedAt: string | null
  createdAt: string
}

export const metadata = {
  title: '招待管理',
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'orange' | 'green' | 'primary'
}) {
  const color =
    accent === 'orange'
      ? 'text-neo-orange'
      : accent === 'green'
        ? 'text-neo-green'
        : accent === 'primary'
          ? 'text-neo-primary'
          : 'text-neo-fg'
  return (
    <div className="bg-neo-card neo-card rounded-xl p-3 text-center">
      <div className={`neo-display text-2xl ${color}`}>{value}</div>
      <div className="neo-body text-[11px] text-neo-fg-soft mt-0.5">{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <span className="neo-code text-xs px-2 py-0.5 bg-neo-green-soft text-neo-on-green-soft border-2 border-neo-green rounded-md whitespace-nowrap">
        招待済み ✅
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="neo-code text-xs px-2 py-0.5 bg-neo-surface text-neo-fg-faint border-2 border-neo-track rounded-md whitespace-nowrap">
        却下
      </span>
    )
  }
  return (
    <span className="neo-code text-xs px-2 py-0.5 bg-neo-orange-soft text-neo-on-orange-soft border-2 border-neo-orange rounded-md whitespace-nowrap">
      未対応
    </span>
  )
}

export default async function InvitesAdminPage() {
  // 運営者でなければページごと弾く（layout で認証済みは保証される）
  const me = await apiJson<{ isAdmin?: boolean }>('/api/v1/auth/me')
  if (!me?.isAdmin) redirect('/projects')

  const [reqData, codeData] = await Promise.all([
    apiJson<{ requests: InviteRequest[] }>('/api/v1/admin/invite-requests'),
    apiJson<{ codes: InviteCode[] }>('/api/v1/admin/invite-codes'),
  ])

  if (!reqData || !codeData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h1 className="neo-display text-2xl text-neo-fg mb-2">読み込めませんでした</h1>
        <p className="neo-body text-sm text-neo-fg-soft">時間をおいて再度お試しください。</p>
        <Link
          href="/projects"
          className="neo-code text-sm text-neo-primary hover:underline mt-4 inline-block"
        >
          ← ダッシュボードへ
        </Link>
      </div>
    )
  }

  const requests = reqData.requests
  const codes = codeData.codes
  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const approvedCount = requests.filter((r) => r.status === 'approved').length
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length

  // 承認時に割り当てられる「有効な」コード（残あり・未失効）
  const now = Date.now()
  const availableCodes = codes
    .filter(
      (co) =>
        !co.deletedAt &&
        co.usedCount < co.maxUses &&
        (!co.expiresAt || new Date(co.expiresAt).getTime() > now),
    )
    .map((co) => ({
      id: co.id,
      code: co.code,
      remaining: co.maxUses - co.usedCount,
      notes: co.notes,
    }))

  // 同一メールの「何回目」と総回数、既発行コードを算出
  const totalByEmail = new Map<string, number>()
  for (const r of requests) totalByEmail.set(r.email, (totalByEmail.get(r.email) ?? 0) + 1)
  const ordinal = new Map<string, number>()
  const counter = new Map<string, number>()
  for (const r of [...requests].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const n = (counter.get(r.email) ?? 0) + 1
    counter.set(r.email, n)
    ordinal.set(r.id, n)
  }
  const issuedCodeByEmail = new Map<string, string>()
  for (const r of requests) {
    if (r.issuedCode && !issuedCodeByEmail.has(r.email)) issuedCodeByEmail.set(r.email, r.issuedCode)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/projects"
        className="neo-code text-sm text-neo-fg-soft hover:text-neo-primary mb-4 inline-block"
      >
        ← 自分の開発ダッシュボードへ
      </Link>

      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="neo-display text-3xl text-neo-fg">招待管理 🎟️</h1>
        <Link
          href="/projects/audit-log"
          className="neo-code text-sm text-neo-primary hover:underline whitespace-nowrap"
        >
          操作ログ 🧾 →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <Stat label="申請総数" value={requests.length} />
        <Stat label="未対応" value={pendingCount} accent="orange" />
        <Stat label="招待済み" value={approvedCount} accent="green" />
        <Stat label="却下" value={rejectedCount} />
        <Stat label="有効コード" value={availableCodes.length} accent="primary" />
      </div>

      {/* コード発行（一括・キャンペーン用） */}
      <div className="bg-neo-card neo-card rounded-2xl p-6 mb-8">
        <h2 className="neo-headline text-neo-fg mb-1">招待コードを発行（一括／配布用）</h2>
        <p className="neo-body text-xs text-neo-fg-faint mb-4">
          個別の申請に返信する場合は、下の申請一覧の「招待して返信」を使ってください。
        </p>
        <IssueCodeForm />
      </div>

      {/* 申請一覧 */}
      <h2 className="neo-headline text-neo-fg mb-3">申請一覧</h2>
      <div className="bg-neo-card neo-card rounded-2xl overflow-hidden mb-8">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-neo-fg-soft neo-body text-sm">
            まだ申請はありません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neo-surface text-neo-fg-soft border-b-2 border-neo-ink">
              <tr>
                <th className="text-left px-4 py-3 neo-label">申請者</th>
                <th className="text-left px-4 py-3 neo-label">内容</th>
                <th className="text-left px-4 py-3 neo-label">状態</th>
                <th className="text-right px-4 py-3 neo-label">操作</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const total = totalByEmail.get(r.email) ?? 1
                const nth = ordinal.get(r.id) ?? 1
                const repeat = total > 1
                const priorCode = issuedCodeByEmail.get(r.email)
                return (
                  <tr key={r.id} className="border-t-2 border-neo-track align-top">
                    <td className="px-4 py-3">
                      <div className="neo-code text-neo-fg break-all">{r.email}</div>
                      {repeat && (
                        <div className="neo-code text-xs text-neo-orange mt-0.5">
                          🔁 {nth}/{total} 回目
                        </div>
                      )}
                      {priorCode && (
                        <div className="neo-code text-[11px] text-neo-fg-faint mt-0.5">
                          既発行: {priorCode}（下の一覧で「上限 +1」も可）
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 neo-body text-neo-fg-soft max-w-xs">
                      {r.name && <div className="text-neo-fg">{r.name}</div>}
                      {r.projectName && <div>{r.projectName}</div>}
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="neo-code text-xs text-neo-primary hover:underline break-all"
                        >
                          {r.url}
                        </a>
                      )}
                      {r.message && <div className="text-xs mt-1">{r.message}</div>}
                      <div className="neo-code text-[11px] text-neo-fg-faint mt-1">
                        {fmt(r.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                      {r.status === 'approved' && r.issuedCode && (
                        <div className="neo-code text-[11px] text-neo-fg-soft mt-1">
                          {r.issuedCode}
                        </div>
                      )}
                      {r.handledAt && (
                        <div className="neo-code text-[11px] text-neo-fg-faint mt-0.5">
                          {fmt(r.handledAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'pending' ? (
                        <RequestActions requestId={r.id} codes={availableCodes} />
                      ) : (
                        <div className="text-right neo-code text-xs text-neo-fg-faint">—</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* コード一覧 */}
      <h2 className="neo-headline text-neo-fg mb-3">発行済み招待コード</h2>
      <div className="bg-neo-card neo-card rounded-2xl overflow-hidden">
        {codes.length === 0 ? (
          <div className="p-12 text-center text-neo-fg-soft neo-body text-sm">
            まだコードはありません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neo-surface text-neo-fg-soft border-b-2 border-neo-ink">
              <tr>
                <th className="text-left px-4 py-3 neo-label">コード</th>
                <th className="text-left px-4 py-3 neo-label">使用</th>
                <th className="text-left px-4 py-3 neo-label">期限</th>
                <th className="text-left px-4 py-3 neo-label">メモ</th>
                <th className="text-right px-4 py-3 neo-label">操作</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((co) => {
                const used = co.usedCount >= co.maxUses
                const expired = co.expiresAt != null && new Date(co.expiresAt) < new Date()
                const deleted = co.deletedAt != null
                return (
                  <tr key={co.id} className={`border-t-2 border-neo-track ${deleted ? 'opacity-55' : ''}`}>
                    <td className="px-4 py-3">
                      <span
                        className={`neo-code font-bold ${deleted ? 'text-neo-fg-faint line-through' : 'text-neo-fg'}`}
                      >
                        {co.code}
                      </span>
                      {deleted && (
                        <span className="ml-2 neo-code text-[10px] px-1.5 py-0.5 bg-neo-danger-soft text-neo-danger border border-neo-danger rounded">
                          削除済み
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 neo-code text-xs">
                      <span className={used ? 'text-neo-fg-faint' : 'text-neo-green'}>
                        {co.usedCount} / {co.maxUses}
                      </span>
                    </td>
                    <td className="px-4 py-3 neo-code text-xs whitespace-nowrap">
                      {co.expiresAt ? (
                        <span className={expired ? 'text-neo-danger' : 'text-neo-fg-soft'}>
                          {fmt(co.expiresAt)}
                        </span>
                      ) : (
                        <span className="text-neo-fg-faint">無期限</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neo-fg-soft">
                      <CodeNotes codeId={co.id} notes={co.notes} />
                    </td>
                    <td className="px-4 py-3">
                      <CodeActions
                        codeId={co.id}
                        code={co.code}
                        maxUses={co.maxUses}
                        deleted={deleted}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
