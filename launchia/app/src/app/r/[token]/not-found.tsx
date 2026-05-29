export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <div className="text-lg font-bold text-gray-800 mb-2">リンクが無効です</div>
        <p className="text-sm text-gray-600 leading-relaxed">
          このリンクは無効、期限切れ、または登録が解除されています。
          <br />
          再度ウェイトリストへの登録をご検討ください。
        </p>
      </div>
    </main>
  )
}
