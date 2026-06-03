export type Env = {
  DATABASE_URL: string
  RESEND_API_KEY: string
  SESSION_SECRET: string
  APP_BASE_URL: string
  ENVIRONMENT: 'development' | 'preview' | 'production'
  // 運営者メール（管理画面アクセス制限＋既定の通知先）。カンマ区切り。未設定なら管理機能は無効。
  ADMIN_EMAILS?: string
  // 招待申請の通知先（受信可能なアドレス）。未設定なら ADMIN_EMAILS に送る。
  INVITE_NOTIFY_TO?: string
}
