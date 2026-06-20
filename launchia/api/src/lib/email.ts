import { Resend } from 'resend'
import type { Env } from '../env'

export type EmailContext = {
  apiKey: string
  fromAddress: string
  appBaseUrl: string
}

export function createEmailContext(env: Env): EmailContext {
  const fromAddress =
    env.ENVIRONMENT === 'production'
      ? 'Launchia <noreply@launchia.net>'
      : 'Launchia <onboarding@resend.dev>'
  return {
    apiKey: env.RESEND_API_KEY,
    fromAddress,
    appBaseUrl: env.APP_BASE_URL,
  }
}

// ── 開発者向けメールの neo ブランド ─────────────────────────────
// DESIGN.md §8: メールは token 対象外（Webフォント/CSS変数/影が効かない媒体）。
// そのためブランド色（藍×オレンジ）と極太ボーダーを inline hex で“寄せる”。
// box-shadow は多くのメールクライアントで無視されるが、3px ボーダーは残り neo らしさが出る。
// ※ エンドユーザー向け（ウェイトリスト確認/完了/解除）は別デザイン系のため従来のままにする。
const NEO_MAIL = {
  bg: '#fbf8fe',
  card: '#ffffff',
  ink: '#1b1b1f',
  primary: '#3f40e7',
  orange: '#fb7800',
  fg: '#1b1b1f',
  fgSoft: '#464555',
  fgFaint: '#767587',
}

function neoMailWordmark(): string {
  return `<span style="font-family:'Lexend',Arial,sans-serif;font-weight:800;font-size:22px;letter-spacing:-0.04em;color:${NEO_MAIL.primary};">Launchia<span style="color:${NEO_MAIL.orange};">.</span></span>`
}

function neoMailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${NEO_MAIL.primary};color:#ffffff;font-family:'Lexend',Arial,sans-serif;font-weight:700;font-size:16px;text-decoration:none;padding:14px 28px;border:3px solid ${NEO_MAIL.ink};border-radius:12px;box-shadow:4px 4px 0 0 ${NEO_MAIL.ink};">${label}</a>`
}

function neoMailShell(opts: { title: string; heading: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${NEO_MAIL.bg};">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${NEO_MAIL.fg};line-height:1.6;">
  <div style="margin-bottom:24px;">${neoMailWordmark()}</div>
  <div style="background:${NEO_MAIL.card};border:3px solid ${NEO_MAIL.ink};border-radius:16px;box-shadow:6px 6px 0 0 ${NEO_MAIL.ink};padding:28px 24px;">
    <h1 style="font-family:'Lexend',Arial,sans-serif;font-weight:800;font-size:20px;letter-spacing:-0.01em;margin:0 0 16px;color:${NEO_MAIL.fg};">${escapeHtml(opts.heading)}</h1>
    ${opts.bodyHtml}
  </div>
  <p style="color:${NEO_MAIL.fgFaint};font-size:12px;margin-top:20px;text-align:center;">
    このメールは <a href="https://launchia.net" style="color:${NEO_MAIL.fgFaint};">Launchia</a> からお送りしています。
  </p>
</div>
</body>
</html>`
}

// ── エンドユーザー向けメールの neo ブランド = Mango Pop ───────────────
// DESIGN.md: エンドユーザー系（/p・/r・widget）は Mango Pop（暖色 neo）。メールも同系統に寄せる。
// 値は globals.css の --color-eu-* と一致（メールは CSS 変数/Web フォント/影が不確実なので inline hex）。
const EU_MAIL = {
  bg: '#fffaef',
  card: '#ffffff',
  surface: '#fff0d0',
  ink: '#2a1c00',
  fg: '#2a1c00',
  fgSoft: '#6b5320',
  fgFaint: '#9c854f',
  primary: '#ff7a00',
  accent: '#ff2e63',
  chipBg: '#ffe8b0',
  chipFg: '#6b4a00',
}

function euMailWordmark(): string {
  return `<span style="font-family:'Lexend',Arial,sans-serif;font-weight:800;font-size:22px;letter-spacing:-0.04em;color:${EU_MAIL.primary};">Launchia<span style="color:${EU_MAIL.accent};">.</span></span>`
}

function euMailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${EU_MAIL.primary};color:#ffffff;font-family:'Lexend',Arial,sans-serif;font-weight:700;font-size:16px;text-decoration:none;padding:14px 28px;border:3px solid ${EU_MAIL.ink};border-radius:12px;box-shadow:4px 4px 0 0 ${EU_MAIL.ink};">${label}</a>`
}

function euMailShell(opts: { title: string; heading: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${EU_MAIL.bg};">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${EU_MAIL.fg};line-height:1.6;">
  <div style="margin-bottom:24px;">${euMailWordmark()}</div>
  <div style="background:${EU_MAIL.card};border:3px solid ${EU_MAIL.ink};border-radius:16px;box-shadow:6px 6px 0 0 ${EU_MAIL.ink};padding:28px 24px;">
    <h1 style="font-family:'Lexend',Arial,sans-serif;font-weight:800;font-size:20px;letter-spacing:-0.01em;margin:0 0 16px;color:${EU_MAIL.fg};">${escapeHtml(opts.heading)}</h1>
    ${opts.bodyHtml}
  </div>
  <p style="color:${EU_MAIL.fgFaint};font-size:12px;margin-top:20px;text-align:center;">
    このメールは <a href="https://launchia.net" style="color:${EU_MAIL.fgFaint};">Launchia</a> からお送りしています。
  </p>
</div>
</body>
</html>`
}

type WaitlistConfirmationParams = {
  to: string
  projectName: string
  rankCheckUrl: string
}

export async function sendWaitlistConfirmationEmail(
  ctx: EmailContext,
  params: WaitlistConfirmationParams,
): Promise<void> {
  const resend = new Resend(ctx.apiKey)

  const { error } = await resend.emails.send({
    from: ctx.fromAddress,
    to: params.to,
    subject: `[${params.projectName}] ウェイトリスト登録の確認をお願いします`,
    text: renderConfirmationText(params),
    html: renderConfirmationHtml(params),
  })

  if (error) {
    throw new Error(`sendWaitlistConfirmationEmail failed: ${JSON.stringify(error)}`)
  }
}

type WaitlistConfirmedParams = {
  to: string
  projectName: string
  rank: number
  rankCheckUrl: string
}

export async function sendWaitlistConfirmedEmail(
  ctx: EmailContext,
  params: WaitlistConfirmedParams,
): Promise<void> {
  const resend = new Resend(ctx.apiKey)

  const { error } = await resend.emails.send({
    from: ctx.fromAddress,
    to: params.to,
    subject: `【保管してください】${params.projectName} ウェイトリスト登録が完了しました`,
    text: renderConfirmedText(params),
    html: renderConfirmedHtml(params),
  })

  if (error) {
    throw new Error(`sendWaitlistConfirmedEmail failed: ${JSON.stringify(error)}`)
  }
}

type UnsubscribedParams = {
  to: string
  projectName: string
}

type OtpParams = {
  to: string
  code: string
}

/** 開発者ログイン用の 6 桁 OTP コードをメール送信する（Magic Link 置き換え・neo ブランド）。 */
export async function sendOtpEmail(
  ctx: EmailContext,
  params: OtpParams,
): Promise<void> {
  const resend = new Resend(ctx.apiKey)

  const { error } = await resend.emails.send({
    from: ctx.fromAddress,
    to: params.to,
    subject: `Launchia ログインコード: ${params.code}`,
    text: renderOtpText(params),
    html: renderOtpHtml(params),
  })

  if (error) {
    throw new Error(`sendOtpEmail failed: ${JSON.stringify(error)}`)
  }
}

type InviteRequestNotifyParams = {
  to: string | string[]
  request: {
    email: string
    name?: string | null
    projectName?: string | null
    url?: string | null
    message?: string | null
  }
  adminUrl: string
}

/** 招待コード申請が届いたとき、運営者へ通知する（開発者/内部向け・neo ブランド）。 */
export async function sendInviteRequestNotificationEmail(
  ctx: EmailContext,
  params: InviteRequestNotifyParams,
): Promise<void> {
  const resend = new Resend(ctx.apiKey)
  const r = params.request
  const rows: Array<[string, string]> = [['メール', r.email]]
  if (r.name) rows.push(['お名前', r.name])
  if (r.projectName) rows.push(['プロダクト', r.projectName])
  if (r.url) rows.push(['URL', r.url])
  if (r.message) rows.push(['ひとこと', r.message])

  const tableHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px;color:${NEO_MAIL.fgFaint};white-space:nowrap;vertical-align:top;font-size:13px;">${escapeHtml(k)}</td><td style="padding:6px 10px;color:${NEO_MAIL.fg};font-size:14px;">${escapeHtml(v)}</td></tr>`,
    )
    .join('')

  const bodyHtml = `
    <p style="margin:0 0 16px;color:${NEO_MAIL.fgSoft};">新しい招待コード申請が届きました。</p>
    <table style="width:100%;border-collapse:collapse;">${tableHtml}</table>
    <p style="margin:22px 0 0;text-align:center;">${neoMailButton(escapeAttr(params.adminUrl), '管理画面で確認する')}</p>
  `

  const { error } = await resend.emails.send({
    from: ctx.fromAddress,
    to: params.to,
    subject: '【Launchia】新しい招待コード申請が届きました',
    text: [
      '新しい招待コード申請が届きました。',
      '',
      ...rows.map(([k, v]) => `${k}: ${v}`),
      '',
      `管理画面: ${params.adminUrl}`,
    ].join('\n'),
    html: neoMailShell({
      title: '新しい招待コード申請',
      heading: '招待コード申請が届きました',
      bodyHtml,
    }),
  })

  if (error) {
    throw new Error(`sendInviteRequestNotificationEmail failed: ${JSON.stringify(error)}`)
  }
}

type InviteCodeEmailParams = {
  to: string
  code: string
  loginUrl: string
  expiresAt?: Date | null
}

/** 申請を承認したとき、申請者へ招待コードを送る（neo ブランド）。 */
export async function sendInviteCodeEmail(
  ctx: EmailContext,
  params: InviteCodeEmailParams,
): Promise<void> {
  const resend = new Resend(ctx.apiKey)
  const expiryNote = params.expiresAt
    ? `<p style="margin:14px 0 0;color:${NEO_MAIL.fgFaint};font-size:13px;text-align:center;">※ このコードは ${params.expiresAt.toLocaleDateString('ja-JP')} まで有効です。</p>`
    : ''
  const bodyHtml = `
    <p style="margin:0 0 16px;color:${NEO_MAIL.fgSoft};">Launchia へのお申し込みありがとうございます。招待コードをお送りします。</p>
    <div style="text-align:center;margin:20px 0;">
      <div style="display:inline-block;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:22px;letter-spacing:1px;color:${NEO_MAIL.fg};background:${NEO_MAIL.bg};border:3px solid ${NEO_MAIL.ink};border-radius:12px;padding:12px 20px;">${escapeHtml(params.code)}</div>
    </div>
    <p style="margin:0 0 20px;color:${NEO_MAIL.fgSoft};">ログインページでメールアドレスと上記コードを入力すると、ご利用を開始できます。</p>
    <p style="margin:0;text-align:center;">${neoMailButton(escapeAttr(params.loginUrl), 'ログインする')}</p>
    ${expiryNote}
  `
  const { error } = await resend.emails.send({
    from: ctx.fromAddress,
    to: params.to,
    subject: '【Launchia】招待コードのお知らせ',
    text: [
      'Launchia へのお申し込みありがとうございます。招待コードをお送りします。',
      '',
      `招待コード: ${params.code}`,
      '',
      `ログインページでメールアドレスと上記コードを入力するとご利用を開始できます: ${params.loginUrl}`,
      ...(params.expiresAt
        ? ['', `※ このコードは ${params.expiresAt.toLocaleDateString('ja-JP')} まで有効です。`]
        : []),
    ].join('\n'),
    html: neoMailShell({
      title: '招待コードのお知らせ',
      heading: '招待コードが届きました 🎟️',
      bodyHtml,
    }),
  })

  if (error) {
    throw new Error(`sendInviteCodeEmail failed: ${JSON.stringify(error)}`)
  }
}

/** 申請を却下したとき、申請者へ丁寧にお知らせする（任意送信）。 */
export async function sendInviteRejectedEmail(
  ctx: EmailContext,
  params: { to: string },
): Promise<void> {
  const resend = new Resend(ctx.apiKey)
  const bodyHtml = `
    <p style="margin:0 0 14px;color:${NEO_MAIL.fgSoft};">このたびは Launchia にお申し込みいただきありがとうございます。</p>
    <p style="margin:0 0 14px;color:${NEO_MAIL.fgSoft};">検討の結果、現時点ではご案内を見送らせていただくこととなりました。</p>
    <p style="margin:0;color:${NEO_MAIL.fgSoft};">招待枠が空き次第ご案内できる場合がございます。何卒ご了承ください。</p>
  `
  const { error } = await resend.emails.send({
    from: ctx.fromAddress,
    to: params.to,
    subject: '【Launchia】お申し込みについて',
    text: [
      'このたびは Launchia にお申し込みいただきありがとうございます。',
      '',
      '検討の結果、現時点ではご案内を見送らせていただくこととなりました。',
      '招待枠が空き次第ご案内できる場合がございます。何卒ご了承ください。',
    ].join('\n'),
    html: neoMailShell({
      title: 'お申し込みについて',
      heading: 'お申し込みについて',
      bodyHtml,
    }),
  })

  if (error) {
    throw new Error(`sendInviteRejectedEmail failed: ${JSON.stringify(error)}`)
  }
}

export async function sendUnsubscribedEmail(
  ctx: EmailContext,
  params: UnsubscribedParams,
): Promise<void> {
  const resend = new Resend(ctx.apiKey)

  const { error } = await resend.emails.send({
    from: ctx.fromAddress,
    to: params.to,
    subject: `[${params.projectName}] ウェイトリスト登録解除のお知らせ`,
    text: renderUnsubscribedText(params),
    html: renderUnsubscribedHtml(params),
  })

  if (error) {
    throw new Error(`sendUnsubscribedEmail failed: ${JSON.stringify(error)}`)
  }
}

function renderConfirmationText(params: WaitlistConfirmationParams): string {
  return [
    `${params.projectName} のウェイトリストにご登録いただきありがとうございます。`,
    '',
    '登録を完了するには、下記のリンクからアクセスしてください。',
    'クリック後、あなたの順位を確認できます。',
    '',
    params.rankCheckUrl,
    '',
    '※ このリンクをクリックしない場合、登録は完了しません。',
    '',
    'もしこの登録に心当たりがない場合は、このメールを無視してください。',
    '',
    '---',
    'このメールは Launchia (https://launchia.net) からお送りしています。',
  ].join('\n')
}

function renderConfirmationHtml(params: WaitlistConfirmationParams): string {
  const project = escapeHtml(params.projectName)
  const url = escapeAttr(params.rankCheckUrl)
  return euMailShell({
    title: `${params.projectName} のウェイトリスト登録の確認`,
    heading: '登録の確認をお願いします',
    bodyHtml: `
      <p style="margin:0 0 16px;color:${EU_MAIL.fgSoft};"><strong style="color:${EU_MAIL.fg};">${project}</strong> のウェイトリストへのご登録ありがとうございます。</p>
      <p style="margin:0 0 20px;color:${EU_MAIL.fgSoft};">下のボタンから登録を完了してください。クリック後、あなたの順位が表示されます。</p>
      <p style="margin:0 0 20px;text-align:center;">${euMailButton(url, '登録を完了する')}</p>
      <p style="margin:0;color:${EU_MAIL.chipFg};background:${EU_MAIL.chipBg};border:2px solid ${EU_MAIL.ink};border-radius:10px;padding:12px 14px;font-size:13px;">※ このリンクをクリックしない場合、登録は完了せず、順位にも算入されません。</p>
      <p style="margin:16px 0 0;color:${EU_MAIL.fgFaint};font-size:13px;">心当たりがない場合は、このメールを無視してください。</p>
    `,
  })
}

function renderConfirmedText(params: WaitlistConfirmedParams): string {
  return [
    `${params.projectName} のウェイトリストへの登録が完了しました！`,
    '',
    `あなたの順位: ${params.rank} 番目`,
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '★ このメールは大切に保管してください ★',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    '下記はあなた専用のリンクです。',
    '今後の順位確認・登録解除は、このリンクから行えます。',
    'メールを削除すると順位を確認できなくなりますので、保管をおすすめします。',
    '',
    params.rankCheckUrl,
    '',
    'リリースの際は、ご登録のメールアドレスにご連絡します。',
    '',
    '---',
    'このメールは Launchia (https://launchia.net) からお送りしています。',
  ].join('\n')
}

function renderConfirmedHtml(params: WaitlistConfirmedParams): string {
  const project = escapeHtml(params.projectName)
  const url = escapeAttr(params.rankCheckUrl)
  return euMailShell({
    title: `${params.projectName} のウェイトリスト登録完了`,
    heading: '登録が完了しました 🎉',
    bodyHtml: `
      <p style="margin:0 0 16px;color:${EU_MAIL.fgSoft};"><strong style="color:${EU_MAIL.fg};">${project}</strong> のウェイトリストへの登録が完了しました。</p>
      <div style="text-align:center;margin:20px 0;background:${EU_MAIL.surface};border:3px solid ${EU_MAIL.ink};border-radius:14px;padding:18px;">
        <div style="color:${EU_MAIL.fgSoft};font-size:13px;margin-bottom:4px;">あなたの順位</div>
        <div style="font-family:'Lexend',Arial,sans-serif;font-weight:800;font-size:44px;line-height:1;color:${EU_MAIL.primary};">${params.rank}<span style="font-size:18px;color:${EU_MAIL.fg};"> 番目</span></div>
      </div>
      <div style="background:${EU_MAIL.chipBg};border:2px solid ${EU_MAIL.ink};border-radius:10px;padding:12px 14px;margin:0 0 20px;">
        <p style="margin:0 0 6px;font-weight:700;color:${EU_MAIL.chipFg};font-family:'Lexend',Arial,sans-serif;">⚠️ このメールは大切に保管してください</p>
        <p style="margin:0;font-size:13px;color:${EU_MAIL.chipFg};">下のボタン/リンクから、いつでも<strong>順位確認・登録解除</strong>ができます。メールを削除すると順位を確認できなくなります。</p>
      </div>
      <p style="margin:0 0 16px;text-align:center;">${euMailButton(url, '順位を確認する')}</p>
      <p style="margin:0;color:${EU_MAIL.fgSoft};font-size:13px;">リリースの際は、ご登録のメールアドレスにご連絡します。</p>
    `,
  })
}

function renderUnsubscribedText(params: UnsubscribedParams): string {
  return [
    `${params.projectName} のウェイトリストから登録を解除しました。`,
    '',
    `今後 ${params.projectName} に関するメールはお送りいたしません。`,
    '',
    'もし誤って解除してしまった場合は、再度ウェイトリスト登録ページから登録してください。',
    '',
    '---',
    'このメールは Launchia (https://launchia.net) からお送りしています。',
  ].join('\n')
}

function renderUnsubscribedHtml(params: UnsubscribedParams): string {
  const project = escapeHtml(params.projectName)
  return euMailShell({
    title: `${params.projectName} のウェイトリスト登録解除`,
    heading: '登録解除のお知らせ',
    bodyHtml: `
      <p style="margin:0 0 14px;color:${EU_MAIL.fgSoft};"><strong style="color:${EU_MAIL.fg};">${project}</strong> のウェイトリストから登録を解除しました。</p>
      <p style="margin:0 0 14px;color:${EU_MAIL.fgSoft};">今後 ${project} に関するメールはお送りいたしません。</p>
      <p style="margin:0;color:${EU_MAIL.fgSoft};">もし誤って解除した場合は、再度ウェイトリスト登録ページからご登録ください。</p>
    `,
  })
}

function renderOtpText(params: OtpParams): string {
  return [
    'Launchia のログインコードです。',
    '',
    '作業中のブラウザの入力欄に、次のコードを入力してください:',
    '',
    `    ${params.code}`,
    '',
    '※ このコードは 10 分間のみ有効です。',
    '※ 入力を 5 回間違えると無効になります（その場合は再送してください）。',
    '※ 心当たりがない場合は、このメールを無視してください。',
    '',
    '---',
    'このメールは Launchia (https://launchia.net) からお送りしています。',
  ].join('\n')
}

function renderOtpHtml(params: OtpParams): string {
  const code = escapeHtml(params.code)
  return neoMailShell({
    title: 'Launchia ログインコード',
    heading: 'ログインコード',
    bodyHtml: `
      <p style="margin:0 0 20px;color:${NEO_MAIL.fgSoft};">作業中のブラウザの入力欄に、次のコードを入力してください。</p>
      <div style="margin:0 0 20px;text-align:center;">
        <span style="display:inline-block;font-family:'Courier New',monospace;font-weight:800;font-size:34px;letter-spacing:0.28em;color:${NEO_MAIL.ink};background:${NEO_MAIL.bg};border:3px solid ${NEO_MAIL.ink};border-radius:12px;box-shadow:4px 4px 0 0 ${NEO_MAIL.ink};padding:16px 12px 16px 24px;">${code}</span>
      </div>
      <p style="margin:0;color:${NEO_MAIL.fgFaint};font-size:13px;">※ このコードは 10 分間のみ有効です。</p>
      <p style="margin:6px 0 0;color:${NEO_MAIL.fgFaint};font-size:13px;">※ 入力を 5 回間違えると無効になります（その場合は再送してください）。</p>
      <p style="margin:6px 0 0;color:${NEO_MAIL.fgFaint};font-size:13px;">※ 心当たりがない場合は、このメールを無視してください。</p>
    `,
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(text: string): string {
  return escapeHtml(text)
}
