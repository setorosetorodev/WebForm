export type Env = {
  DATABASE_URL: string
  RESEND_API_KEY: string
  SESSION_SECRET: string
  APP_BASE_URL: string
  ENVIRONMENT: 'development' | 'preview' | 'production'
}
