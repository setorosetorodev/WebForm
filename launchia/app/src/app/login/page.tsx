import { LoginForm } from './login-form'

export const metadata = {
  title: 'ログイン｜Launchia 管理画面',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-fg mb-2">Launchia</h1>
          <p className="text-sm text-fg-soft">開発者向け管理画面</p>
        </div>

        <LoginForm />

        <div className="text-xs text-fg-faint text-center mt-8 leading-relaxed">
          パスワードは不要です。
          <br />
          メールに届くリンクをクリックしてログインします。
          <br />
          新規の方は招待コードが必要です。
        </div>

        <div className="text-xs text-fg-faint text-center mt-6">
          <a href="/privacy" className="hover:text-fg-soft hover:underline">
            プライバシーポリシー
          </a>
        </div>
      </div>
    </main>
  )
}
