const template = document.createElement('template')

template.innerHTML = `
<style>
  /* Launchia エンドユーザー neo（Mango Pop）。Shadow DOM 内に閉じる＝ホストに影響しない。
     色トークンは app の --color-eu-* と同値（出典: globals.css / brand.ts EU_CSS）。 */
  @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@600;700;800&display=swap');

  :host {
    display: block;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: var(--eu-fg);
    --eu-ink: #2a1c00;
    --eu-fg: #2a1c00;
    --eu-fg-soft: #6b5320;
    --eu-fg-faint: #9c854f;
    --eu-card: #ffffff;
    --eu-surface: #fff0d0;
    --eu-primary: #ff7a00;
    --eu-primary-strong: #ff9a1f;
    --eu-on-primary: #ffffff;
    --eu-accent: #ff2e63;
    --eu-chip-bg: #ffe8b0;
    --eu-chip-fg: #6b4a00;
  }

  .form-container {
    background: var(--eu-card);
    border: 3px solid var(--eu-ink);
    box-shadow: 5px 5px 0 0 var(--eu-ink);
    border-radius: 16px;
    max-width: 480px;
    margin: 0 auto;
    padding: 24px;
    box-sizing: border-box;
  }

  .form-group {
    margin-bottom: 14px;
  }

  input[type="email"] {
    width: 100%;
    padding: 12px 14px;
    border: 3px solid var(--eu-ink);
    border-radius: 12px;
    font-size: 1rem;
    background-color: var(--eu-card);
    transition: box-shadow 0.12s ease;
    box-sizing: border-box;
    font-family: inherit;
    color: var(--eu-fg);
  }

  input::placeholder {
    color: var(--eu-fg-faint);
  }

  input:focus {
    outline: none;
    box-shadow: 4px 4px 0 0 var(--eu-primary);
  }

  input.invalid {
    box-shadow: 4px 4px 0 0 var(--eu-accent);
  }

  .field-error {
    color: var(--eu-accent);
    font-size: 0.75rem;
    margin-top: 8px;
    display: none;
  }

  input.invalid ~ .field-error {
    display: block;
  }

  .consent-group {
    display: none;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: var(--eu-fg-soft);
    margin-bottom: 14px;
  }

  :host([require-consent="true"]) .consent-group {
    display: flex;
  }

  .consent-group input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--eu-primary);
    flex-shrink: 0;
  }

  .consent-group label {
    cursor: pointer;
    user-select: none;
  }

  .consent-group a {
    color: var(--eu-primary);
    font-weight: 600;
    text-decoration: none;
  }

  .consent-group a:hover {
    text-decoration: underline;
  }

  :host([require-consent="true"]) .consent-group input[type="checkbox"].invalid {
    outline: 2px solid var(--eu-accent);
    outline-offset: 2px;
    border-radius: 3px;
  }

  .consent-error {
    display: none;
    color: var(--eu-accent);
    font-size: 0.75rem;
    margin-top: -8px;
    margin-bottom: 14px;
    padding-left: 24px;
  }

  .consent-error.visible {
    display: block;
  }

  .submit-btn {
    width: 100%;
    padding: 14px 20px;
    background-color: var(--eu-primary);
    color: var(--eu-on-primary);
    border: 3px solid var(--eu-ink);
    box-shadow: 4px 4px 0 0 var(--eu-ink);
    border-radius: 12px;
    font-family: 'Lexend', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 0 var(--eu-ink);
  }

  .submit-btn:active:not(:disabled) {
    transform: translate(0, 0);
    box-shadow: 0 0 0 0 var(--eu-ink);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: 4px 4px 0 0 var(--eu-ink);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.7s linear infinite;
    display: none;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  :host([state="submitting"]) .spinner {
    display: block;
  }

  :host([state="submitting"]) .btn-text-default {
    display: none;
  }

  :host([state="submitting"]) .btn-text-submitting {
    display: inline;
  }

  .btn-text-default {
    display: inline;
  }

  .btn-text-submitting {
    display: none;
  }

  .status-panel {
    display: none;
    text-align: center;
    padding: 8px 4px;
  }

  .status-icon {
    font-size: 44px;
    margin-bottom: 10px;
    line-height: 1;
  }

  .status-title {
    font-family: 'Lexend', system-ui, sans-serif;
    font-size: 1.125rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    margin-bottom: 8px;
    color: var(--eu-fg);
  }

  .status-desc {
    color: var(--eu-fg-soft);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .rank-display {
    background: var(--eu-chip-bg);
    border: 2px solid var(--eu-ink);
    box-shadow: 3px 3px 0 0 var(--eu-ink);
    border-radius: 12px;
    padding: 18px;
    margin: 16px 0;
    text-align: center;
  }

  .rank-label {
    font-size: 0.75rem;
    color: var(--eu-chip-fg);
    margin-bottom: 4px;
  }

  .rank-value {
    font-family: 'Lexend', system-ui, sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--eu-primary);
  }

  .rank-value-unit {
    font-family: 'Lexend', system-ui, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--eu-fg);
    margin-left: 4px;
  }

  :host([state="pending"]) .form-content { display: none; }
  :host([state="pending"]) .status-panel.pending { display: block; }

  :host([state="resent"]) .form-content { display: none; }
  :host([state="resent"]) .status-panel.resent { display: block; }

  :host([state="already"]) .form-content { display: none; }
  :host([state="already"]) .status-panel.already { display: block; }

  :host([state="error"]) .form-content { display: none; }
  :host([state="error"]) .status-panel.error { display: block; }

  .reset-btn {
    background: var(--eu-card);
    border: 2px solid var(--eu-ink);
    box-shadow: 2px 2px 0 0 var(--eu-ink);
    color: var(--eu-fg);
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    margin-top: 12px;
    font-family: inherit;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .reset-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 0 var(--eu-ink);
  }
</style>

<div class="form-container">
  <div class="status-panel pending">
    <div class="status-icon">📧</div>
    <div class="status-title">確認メールを送信しました</div>
    <div class="status-desc">
      お送りしたメール内のリンクをクリックして、登録を完了してください。<br>
      クリック後、あなたの順位を確認できます。
    </div>
  </div>

  <div class="status-panel resent">
    <div class="status-icon">📧</div>
    <div class="status-title">確認メールを再送しました</div>
    <div class="status-desc">
      前回のメールが見つからない場合は、新しいメールをご確認ください。<br>
      リンクをクリックすると、登録完了と同時に順位が表示されます。
    </div>
  </div>

  <div class="status-panel already">
    <div class="status-icon">✓</div>
    <div class="status-title">すでにご登録済みです</div>
    <div class="rank-display">
      <div class="rank-label">あなたの順位</div>
      <div>
        <span class="rank-value" data-already-rank></span><span class="rank-value-unit">番目</span>
      </div>
    </div>
    <div class="status-desc">同じメールアドレスでの登録が確認できました。<br>順位確認 URL はメールでお送り済みです。</div>
  </div>

  <div class="status-panel error">
    <div class="status-icon">⚠️</div>
    <div class="status-title">送信に失敗しました</div>
    <div class="status-desc" data-error-desc>通信エラーが発生しました。時間をおいて再度お試しください。</div>
    <button type="button" class="reset-btn" data-retry-btn>戻る</button>
  </div>

  <form class="form-content" data-form novalidate>
    <div class="form-group">
      <input type="email" name="email" required pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}" title="example@domain.com の形式で入力してください" placeholder="メールアドレス" autocomplete="email" data-email>
      <div class="field-error">有効なメールアドレスを入力してください。</div>
    </div>

    <div class="consent-group">
      <input type="checkbox" name="consent" id="lc-consent" data-consent>
      <label for="lc-consent">
        <a href="#" target="_blank" rel="noopener" data-privacy-link>プライバシーポリシー</a>に同意する
      </label>
    </div>
    <div class="consent-error" data-consent-error>プライバシーポリシーへの同意が必要です。</div>

    <button type="submit" class="submit-btn" data-submit-btn>
      <span class="btn-text-default">ウェイトリストに登録</span>
      <span class="btn-text-submitting">送信中...</span>
      <div class="spinner"></div>
    </button>
  </form>
</div>
`

const DEFAULT_API_URL = 'https://api.launchia.net'

type RegisterResponse = {
  rank?: number
  project_name?: string
  status?: 'pending_confirmation' | 'confirmation_resent'
  message?: string
  error?: string
  details?: unknown
}

export class LaunchiaWidget extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot!.appendChild(template.content.cloneNode(true))
  }

  connectedCallback() {
    this.setup()
  }

  private q<T extends Element>(selector: string): T | null {
    return this.shadowRoot!.querySelector<T>(selector)
  }

  private setup() {
    const form = this.q<HTMLFormElement>('[data-form]')
    const submitBtn = this.q<HTMLButtonElement>('[data-submit-btn]')
    const retryBtn = this.q<HTMLButtonElement>('[data-retry-btn]')
    const consentCheckbox = this.q<HTMLInputElement>('[data-consent]')

    if (!form || !submitBtn) return

    const requireConsent = this.getAttribute('require-consent') === 'true'
    if (requireConsent && consentCheckbox) {
      consentCheckbox.required = true
    }

    retryBtn?.addEventListener('click', () => {
      this.removeAttribute('state')
    })

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (!this.validate(form)) return

      const emailInput = this.q<HTMLInputElement>('[data-email]')!
      const email = emailInput.value.trim()
      const consent = requireConsent && consentCheckbox ? consentCheckbox.checked : undefined
      const projectSlug = this.getAttribute('project-slug')
      const apiUrl = this.getAttribute('api-url') || DEFAULT_API_URL

      if (!projectSlug) {
        this.showError('project-slug 属性が設定されていません。サイト管理者にお問い合わせください。')
        return
      }

      this.setAttribute('state', 'submitting')
      submitBtn.disabled = true

      try {
        const url = `${apiUrl}/api/v1/public/projects/${encodeURIComponent(projectSlug)}/entries`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            consent,
            source: 'embed',
          }),
        })

        const data = (await res.json().catch(() => ({}))) as RegisterResponse

        if (res.status === 201 && data.status === 'pending_confirmation') {
          this.setAttribute('state', 'pending')
          form.reset()
        } else if (res.status === 200 && data.status === 'confirmation_resent') {
          this.setAttribute('state', 'resent')
          form.reset()
        } else if (res.status === 409 && data.error === 'already_registered') {
          this.showAlready(data.rank ?? 0)
          form.reset()
        } else if (res.status === 400 && data.error === 'consent_required') {
          this.showError('プライバシーポリシーへの同意が必要です。')
        } else if (res.status === 400 && data.error === 'validation_failed') {
          this.showError('メールアドレスの形式が正しくありません。example@domain.com の形式で入力してください。')
        } else if (res.status === 400) {
          this.showError('入力内容に誤りがあります。メールアドレスをご確認ください。')
        } else if (res.status === 403) {
          this.showError('このページから登録できません。サイト管理者にお問い合わせください。')
        } else if (res.status === 404) {
          this.showError('ウェイトリストが見つかりません。')
        } else {
          this.showError('予期しないエラーが発生しました。時間をおいて再度お試しください。')
        }
      } catch (err) {
        console.error('Launchia widget submission error:', err)
        this.showError('通信エラーが発生しました。時間をおいて再度お試しください。')
      } finally {
        submitBtn.disabled = false
      }
    })
  }

  private validate(form: HTMLFormElement): boolean {
    let isValid = true

    const emailEl = this.q<HTMLInputElement>('[data-email]')
    if (emailEl) {
      if (!emailEl.checkValidity()) {
        emailEl.classList.add('invalid')
        isValid = false
        emailEl.addEventListener('input', () => emailEl.classList.remove('invalid'), {
          once: true,
        })
      } else {
        emailEl.classList.remove('invalid')
      }
    }

    const requireConsent = this.getAttribute('require-consent') === 'true'
    const consentEl = this.q<HTMLInputElement>('[data-consent]')
    const consentError = this.q<HTMLElement>('[data-consent-error]')
    if (requireConsent && consentEl) {
      if (!consentEl.checked) {
        consentEl.classList.add('invalid')
        consentError?.classList.add('visible')
        isValid = false
        consentEl.addEventListener(
          'change',
          () => {
            consentEl.classList.remove('invalid')
            consentError?.classList.remove('visible')
          },
          { once: true },
        )
      } else {
        consentEl.classList.remove('invalid')
        consentError?.classList.remove('visible')
      }
    }

    // suppress unused: form param is kept for signature parity with potential future fields
    void form
    return isValid
  }

  private showAlready(rank: number) {
    const el = this.q<HTMLElement>('[data-already-rank]')
    if (el) el.textContent = String(rank)
    this.setAttribute('state', 'already')
  }

  private showError(message: string) {
    const el = this.q<HTMLElement>('[data-error-desc]')
    if (el) el.textContent = message
    this.setAttribute('state', 'error')
  }
}

if (!customElements.get('launchia-widget')) {
  customElements.define('launchia-widget', LaunchiaWidget)
}
