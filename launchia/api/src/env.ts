export type Env = {
  DATABASE_URL: string
  RESEND_API_KEY: string
  SESSION_SECRET: string
  APP_BASE_URL: string
  ENVIRONMENT: 'development' | 'preview' | 'production'
  // 招待申請の通知先（受信可能なアドレス。例 support@launchia.net）。未設定なら通知しない。
  // ※ 運営者の識別は env ではなく DB（launchia_users.is_admin）で行う。
  INVITE_NOTIFY_TO?: string
  // 監査ログの宛先メール暗号化キー（AES-256-GCM 用 32バイトを base64 化）。Worker Secret / .dev.vars。
  // 未設定なら宛先の暗号化保存はスキップ（監査行自体は記録する）。
  AUDIT_ENC_KEY?: string
}
