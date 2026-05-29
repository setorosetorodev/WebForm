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

type UnsubscribedParams = {
  to: string
  projectName: string
}

type MagicLinkParams = {
  to: string
  verifyUrl: string
}

export async function sendMagicLinkEmail(
  ctx: EmailContext,
  params: MagicLinkParams,
): Promise<void> {
  const resend = new Resend(ctx.apiKey)

  const { error } = await resend.emails.send({
    from: ctx.fromAddress,
    to: params.to,
    subject: 'Launchia へのログインリンク',
    text: renderMagicLinkText(params),
    html: renderMagicLinkHtml(params),
  })

  if (error) {
    throw new Error(`sendMagicLinkEmail failed: ${JSON.stringify(error)}`)
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
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${project} のウェイトリスト登録の確認</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 1.25rem; margin-bottom: 16px;">登録の確認をお願いします</h1>
  <p><strong>${project}</strong> のウェイトリストへの登録ありがとうございます。</p>
  <p>登録を完了するには、下記のボタンをクリックしてください。クリック後、あなたの順位を確認できます。</p>

  <p style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="background: #3b82f6; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600;">
      登録を完了する
    </a>
  </p>

  <p style="color: #6b7280; font-size: 0.875rem; padding: 12px; background: #fef3c7; border-radius: 6px;">
    ※ このリンクをクリックしない場合、登録は完了しません。順位にも算入されません。
  </p>

  <p style="color: #6b7280; font-size: 0.875rem; margin-top: 16px;">
    もしこの登録に心当たりがない場合は、このメールを無視してください。
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  <p style="color: #6b7280; font-size: 0.75rem;">
    このメールは <a href="https://launchia.net" style="color: #6b7280;">Launchia</a> からお送りしています。
  </p>
</body>
</html>`
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
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${project} のウェイトリスト登録解除</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 1.25rem; margin-bottom: 16px;">登録解除のお知らせ</h1>
  <p><strong>${project}</strong> のウェイトリストから登録を解除しました。</p>
  <p style="color: #6b7280;">今後 ${project} に関するメールはお送りいたしません。</p>
  <p>もし誤って解除してしまった場合は、再度ウェイトリスト登録ページから登録してください。</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  <p style="color: #6b7280; font-size: 0.75rem;">
    このメールは <a href="https://launchia.net" style="color: #6b7280;">Launchia</a> からお送りしています。
  </p>
</body>
</html>`
}

function renderMagicLinkText(params: MagicLinkParams): string {
  return [
    'Launchia へのログインリンクです。',
    '',
    'こちらをクリックしてログインしてください:',
    params.verifyUrl,
    '',
    '※ このリンクは 15 分間のみ有効です。',
    '※ 心当たりがない場合は、このメールを無視してください。',
    '',
    '---',
    'このメールは Launchia (https://launchia.net) からお送りしています。',
  ].join('\n')
}

function renderMagicLinkHtml(params: MagicLinkParams): string {
  const url = escapeAttr(params.verifyUrl)
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>Launchia ログインリンク</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 1.25rem; margin-bottom: 16px;">ログインリンク</h1>
  <p>Launchia へのログインリンクです。下記のボタンをクリックしてください。</p>

  <p style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="background: #3b82f6; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600;">
      Launchia にログインする
    </a>
  </p>

  <p style="color: #6b7280; font-size: 0.875rem;">※ このリンクは 15 分間のみ有効です。</p>
  <p style="color: #6b7280; font-size: 0.875rem;">※ 心当たりがない場合は、このメールを無視してください。</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  <p style="color: #6b7280; font-size: 0.75rem;">
    このメールは <a href="https://launchia.net" style="color: #6b7280;">Launchia</a> からお送りしています。
  </p>
</body>
</html>`
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
