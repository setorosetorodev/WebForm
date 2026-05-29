import { LoginForm } from './login-form'

export const metadata = {
  title: 'ログイン - Launchia',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Launchia</h1>
          <p className="text-sm text-gray-500">開発者向け管理画面</p>
        </div>

        <LoginForm />

        <div className="text-xs text-gray-400 text-center mt-8 leading-relaxed">
          パスワードは不要です。メールに届くリンクをクリックしてログインします。
          <br />
          新規の方は招待コードが必要です。
        </div>
      </div>
    </main>
  )
}
