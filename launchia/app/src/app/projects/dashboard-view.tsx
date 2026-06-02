import Link from 'next/link'

export type ProjectStats = {
  total: number
  confirmed: number
  pending: number
  todayNew: number
  daily: number[]
}

export type DashProject = {
  id: string
  slug: string
  name: string
  description: string | null
  embedEnabled: boolean
  ideaPagePublic: boolean
  createdAt: string
  launchTargetDate: string | null
  goalCount: number | null
  stats: ProjectStats
}

export type Overview = {
  totalActive: number
  confirmed: number
  pending: number
  todayNew: number
  weekNew: number
  prevWeekNew: number
  rankViews: number
}

const css = `
.dash {
  --d-bg: #fbf8fe; --d-surface: #f6f2f8; --d-card: #ffffff;
  --d-fg: #1b1b1f; --d-fg-soft: #464555; --d-fg-faint: #767587;
  --d-ink: #1b1b1f; --d-track: #e4e1e7;
  --d-primary: #3f40e7; --d-primary-strong: #5b5eff; --d-on-primary: #ffffff;
  --d-orange: #fb7800; --d-green: #00845a;
  font-family: 'Geist', sans-serif; color: var(--d-fg);
}
.dark .dash {
  --d-bg: #131316; --d-surface: #1f1f29; --d-card: #1a1a22;
  --d-fg: #ece9f0; --d-fg-soft: #bdb9cc; --d-fg-faint: #908ca0;
  --d-ink: #3a3a48; --d-track: #2a2a35;
  --d-primary: #9aa0ff; --d-primary-strong: #6f6dff; --d-on-primary: #0c0c1a;
  --d-orange: #ff9a3d; --d-green: #34d99e;
}
.dash-display { font-family: 'Lexend', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
.dash-head { font-family: 'Lexend', sans-serif; font-weight: 700; }
.dash-code { font-family: 'JetBrains Mono', monospace; }
.dash .neo { border: 3px solid var(--d-ink); box-shadow: 5px 5px 0 0 var(--d-ink); }
.dash .neo-sm { border: 2px solid var(--d-ink); box-shadow: 3px 3px 0 0 var(--d-ink); }
.dash a.neo-card { transition: transform .18s cubic-bezier(.2,.8,.2,1), box-shadow .18s ease; }
.dash a.neo-card:hover { transform: translateY(-4px); box-shadow: 8px 10px 0 0 var(--d-ink); }
`

function fmt(n: number): string {
  return n.toLocaleString('ja-JP')
}

/** JST 基準で予定日までの残日数。負なら過去（ローンチ済み） */
function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00+09:00`).getTime()
  const todayStr = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
  const today = new Date(`${todayStr}T00:00:00+09:00`).getTime()
  return Math.round((target - today) / 86400000)
}

function growthPct(week: number, prev: number): number | null {
  if (prev === 0) return week > 0 ? 100 : null
  return Math.round(((week - prev) / prev) * 100)
}

/** ダッシュボード描画本体（データは props で受け取る＝実データ/デモ両用） */
export function DashboardView({
  projects,
  overview: ov,
}: {
  projects: DashProject[]
  overview: Overview
}) {
  const confirmRate = ov.totalActive > 0 ? Math.round((ov.confirmed / ov.totalActive) * 100) : 0
  const growth = growthPct(ov.weekNew, ov.prevWeekNew)

  return (
    <div className="dash bg-[var(--d-bg)]">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@500&family=Lexend:wght@500;600;700;800&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome + new */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
          <div>
            <h1 className="dash-display text-3xl md:text-4xl">
              Mission Control <span className="text-2xl md:text-3xl">🚀</span>
            </h1>
            <p className="text-[var(--d-fg-soft)] mt-1">
              {ov.todayNew > 0
                ? `今日はもう ${fmt(ov.todayNew)} 人が登録。いい流れです。`
                : 'プロジェクトの熱量を、ここで見守りましょう。'}
            </p>
          </div>
          <Link
            href="/projects/new"
            className="neo-sm dash-head bg-[var(--d-primary)] text-[var(--d-on-primary)] px-5 py-2.5 rounded-xl"
          >
            + 新規作成
          </Link>
        </div>

        {/* Overview metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
          <Metric label="総登録者" value={fmt(ov.totalActive)} accent="var(--d-primary)" icon="👥"
            sub={growth != null ? `前週比 ${growth >= 0 ? '↑' : '↓'}${Math.abs(growth)}%` : '前週比 —'} />
          <Metric label="確認済み" value={fmt(ov.confirmed)} accent="var(--d-green)" icon="✅"
            sub={`確認率 ${confirmRate}%`} />
          <Metric label="今日の新規" value={fmt(ov.todayNew)} accent="var(--d-orange)" icon="🔥"
            sub={`今週 ${fmt(ov.weekNew)} 人`} />
          <Metric label="順位確認" value={fmt(ov.rankViews)} accent="var(--d-primary-strong)" icon="🏅"
            sub="累計ビュー" />
        </div>

        {/* Projects */}
        {projects.length === 0 ? (
          <div className="neo bg-[var(--d-card)] rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="dash-head text-lg mb-2">まだプロジェクトがありません</div>
            <div className="text-sm text-[var(--d-fg-soft)] mb-5">
              最初のプロジェクトを作って、ウェイトリストを始めましょう。
            </div>
            <Link href="/projects/new" className="neo-sm dash-head inline-block bg-[var(--d-primary)] text-[var(--d-on-primary)] px-5 py-2.5 rounded-xl">
              最初のプロジェクトを作成 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {projects.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string
  value: string
  sub: string
  accent: string
  icon: string
}) {
  return (
    <div className="neo-sm bg-[var(--d-card)] rounded-xl p-4 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: accent }} />
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--d-fg-soft)] dash-head">{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <div className="dash-display text-3xl leading-none" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-[var(--d-fg-faint)] dash-code mt-1.5">{sub}</div>
    </div>
  )
}

function ProjectCard({ p }: { p: DashProject }) {
  const { stats } = p
  const goal = p.goalCount ?? null
  const total = stats.total
  const confirmedPct = goal ? Math.min((stats.confirmed / goal) * 100, 100) : 0
  const totalPct = goal ? Math.min((total / goal) * 100, 100) : 0
  const reachedPct = goal ? Math.round((total / goal) * 100) : 0

  const days = p.launchTargetDate ? daysUntil(p.launchTargetDate) : null
  const milestones = [25, 50, 100, 200]

  const maxDaily = Math.max(1, ...stats.daily)

  return (
    <Link
      href={`/projects/${p.id}`}
      className="neo-card neo bg-[var(--d-card)] rounded-2xl p-5 block"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="dash-head text-lg truncate">{p.name}</h2>
          <div className="dash-code text-xs text-[var(--d-fg-faint)] truncate">/{p.slug}</div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {p.embedEnabled && (
            <span className="text-[10px] dash-code px-2 py-0.5 rounded border-2 border-[var(--d-ink)]">埋込</span>
          )}
          {p.ideaPagePublic && (
            <span className="text-[10px] dash-code px-2 py-0.5 rounded border-2 border-[var(--d-ink)]">公開</span>
          )}
        </div>
      </div>

      {/* Countdown */}
      {days != null && (
        <div className="mb-3 inline-flex items-center gap-2 text-sm dash-head">
          <span>🚀</span>
          {days > 0 ? (
            <span>
              リリースまで <span className="text-[var(--d-orange)] dash-display text-xl">{days}</span> 日
            </span>
          ) : days === 0 ? (
            <span className="text-[var(--d-orange)]">本日ローンチ！🎉</span>
          ) : (
            <span className="text-[var(--d-green)]">ローンチ済み 🎉</span>
          )}
        </div>
      )}

      {/* Goal progress */}
      {goal ? (
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-[var(--d-fg-soft)]">目標 {fmt(goal)} 人</span>
            <span className="dash-code text-xs">
              <span className="text-[var(--d-green)] font-bold">{fmt(stats.confirmed)}</span>
              <span className="text-[var(--d-fg-faint)]"> / {fmt(total)} </span>
              ({reachedPct}%)
            </span>
          </div>
          <div className="h-4 w-full rounded-full border-2 border-[var(--d-ink)] bg-[var(--d-track)] overflow-hidden relative">
            <div className="absolute inset-y-0 left-0" style={{ width: `${totalPct}%`, background: 'var(--d-orange)', opacity: 0.35 }} />
            <div className="absolute inset-y-0 left-0" style={{ width: `${confirmedPct}%`, background: 'var(--d-green)' }} />
          </div>
          <div className="flex gap-1 mt-2">
            {milestones.map((m) => {
              const hit = reachedPct >= m
              return (
                <span
                  key={m}
                  className="text-[10px] dash-code px-1.5 py-0.5 rounded-full border"
                  style={{
                    borderColor: hit ? 'var(--d-green)' : 'var(--d-track)',
                    color: hit ? 'var(--d-green)' : 'var(--d-fg-faint)',
                    fontWeight: hit ? 700 : 400,
                  }}
                >
                  {hit ? '🏅' : ''}{m}%
                </span>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mb-3 text-xs text-[var(--d-fg-faint)]">
          目標未設定（編集で目標登録数を入れると進捗バーが出ます）
        </div>
      )}

      {/* counts + sparkline */}
      <div className="flex items-end justify-between gap-3 pt-1">
        <div className="flex gap-4">
          <div>
            <div className="dash-display text-2xl leading-none">{fmt(total)}</div>
            <div className="text-[10px] text-[var(--d-fg-faint)] dash-code mt-0.5">登録</div>
          </div>
          <div>
            <div className="dash-display text-2xl leading-none text-[var(--d-orange)]">
              {stats.todayNew > 0 ? `+${fmt(stats.todayNew)}` : '0'}
            </div>
            <div className="text-[10px] text-[var(--d-fg-faint)] dash-code mt-0.5">今日</div>
          </div>
        </div>
        <div className="flex items-end gap-0.5 h-8" title="直近7日の新規">
          {stats.daily.map((v, i) => (
            <div
              key={i}
              className="w-1.5 rounded-sm"
              style={{
                height: `${Math.max(8, (v / maxDaily) * 100)}%`,
                background: i === stats.daily.length - 1 ? 'var(--d-orange)' : 'var(--d-primary)',
                opacity: v === 0 ? 0.25 : 1,
              }}
            />
          ))}
        </div>
      </div>
    </Link>
  )
}
