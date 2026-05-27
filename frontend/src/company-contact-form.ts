const template = document.createElement('template');

template.innerHTML = `
<style>
  :host {
    display: block;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #333;
    --primary-color: #3b82f6;
    --primary-hover: #2563eb;
    --error-color: #ef4444;
    --border-color: #e5e7eb;
    --bg-color: #ffffff;
    --input-bg: #f9fafb;
    --text-color: #1f2937;
    --label-color: #4b5563;
  }
  
  .form-container {
    background: var(--bg-color);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    max-width: 600px;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .form-group {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--label-color);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .required-badge {
    background: #fee2e2;
    color: var(--error-color);
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  input[type="text"],
  input[type="email"],
  input[type="tel"],
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 1rem;
    background-color: var(--input-bg);
    transition: all 0.2s ease;
    box-sizing: border-box;
    font-family: inherit;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background-color: #fff;
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  .error-message {
    color: var(--error-color);
    font-size: 0.75rem;
    margin-top: 6px;
    display: none;
  }

  input.invalid, textarea.invalid {
    border-color: var(--error-color);
  }
  
  input.invalid + .error-message, textarea.invalid + .error-message {
    display: block;
  }

  .checkbox-group {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
  }

  .checkbox-group input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .submit-btn {
    width: 100%;
    padding: 12px 20px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .submit-btn:hover {
    background-color: var(--primary-hover);
  }
  
  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
    display: none;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .submitting .spinner {
    display: block;
  }

  .status-message {
    display: none;
    text-align: center;
    padding: 40px 20px;
  }

  .status-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .status-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .status-desc {
    color: var(--label-color);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  /* States */
  :host([state="success"]) .form-content { display: none; }
  :host([state="success"]) .status-message.success { display: block; }
  
  :host([state="error"]) .form-content { display: none; }
  :host([state="error"]) .status-message.error { display: block; }

</style>

<div class="form-container">
  <div class="status-message success">
    <div class="status-icon">🎉</div>
    <div class="status-title">お問い合わせを受け付けました</div>
    <div class="status-desc">内容を確認の上、担当者よりご連絡させていただきます。<br>今しばらくお待ちください。</div>
  </div>

  <div class="status-message error">
    <div class="status-icon">⚠️</div>
    <div class="status-title">送信に失敗しました</div>
    <div class="status-desc">通信エラーが発生しました。<br>時間をおいて再度お試しください。</div>
    <button type="button" class="submit-btn" style="margin-top: 20px;" id="retry-btn">戻る</button>
  </div>

  <form id="contact-form" class="form-content" novalidate>
    <div class="form-group">
      <label for="companyName">会社名 <span class="required-badge">必須</span></label>
      <input type="text" id="companyName" name="companyName" required placeholder="例：株式会社〇〇">
      <div class="error-message">会社名を入力してください。</div>
    </div>
    
    <div class="form-group">
      <label for="departmentName">部署名</label>
      <input type="text" id="departmentName" name="departmentName" placeholder="例：営業部">
    </div>

    <div class="form-group">
      <label for="contactName">氏名 <span class="required-badge">必須</span></label>
      <input type="text" id="contactName" name="contactName" required placeholder="例：山田 太郎">
      <div class="error-message">氏名を入力してください。</div>
    </div>

    <div class="form-group">
      <label for="email">メールアドレス <span class="required-badge">必須</span></label>
      <input type="email" id="email" name="email" required placeholder="例：taro.yamada@example.com">
      <div class="error-message">有効なメールアドレスを入力してください。</div>
    </div>

    <div class="form-group">
      <label for="phone">電話番号 <span class="required-badge">必須</span></label>
      <input type="tel" id="phone" name="phone" required placeholder="例：03-1234-5678" pattern="^[0-9-]+$">
      <div class="error-message">電話番号（ハイフンあり）を正しく入力してください。</div>
    </div>

    <div class="form-group">
      <label for="remarks">お問い合わせ内容</label>
      <textarea id="remarks" name="remarks" placeholder="ご質問やご要望をご記入ください"></textarea>
    </div>

    <div class="form-group checkbox-group" id="consent-group" style="display: none;">
      <input type="checkbox" id="consent" name="consent">
      <label for="consent" style="margin: 0; font-weight: 400;"><a href="#" target="_blank" id="privacy-link" style="color: var(--primary-color);">個人情報保護方針</a>に同意する</label>
    </div>

    <button type="submit" class="submit-btn" id="submit-btn">
      <span class="btn-text">送信する</span>
      <div class="spinner"></div>
    </button>
  </form>
</div>
`;

export class CompanyContactForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.setupForm();
    this.setupConsentCheckbox();
  }

  setupConsentCheckbox() {
    const requireConsent = this.getAttribute('require-consent') === 'true';
    const consentGroup = this.shadowRoot?.getElementById('consent-group');
    const consentCheckbox = this.shadowRoot?.getElementById('consent') as HTMLInputElement;

    if (requireConsent && consentGroup && consentCheckbox) {
      consentGroup.style.display = 'flex';
      consentCheckbox.required = true;
    }
  }

  setupForm() {
    const form = this.shadowRoot?.getElementById('contact-form') as HTMLFormElement;
    const retryBtn = this.shadowRoot?.getElementById('retry-btn');
    const submitBtn = this.shadowRoot?.getElementById('submit-btn') as HTMLButtonElement;

    retryBtn?.addEventListener('click', () => {
      this.removeAttribute('state');
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!this.validateForm(form)) {
        return;
      }

      // Collect data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data.solutionId = this.getAttribute('solution-id') || '';

      const apiUrl = this.getAttribute('api-url') || 'mock';

      // UI state -> submitting
      submitBtn.classList.add('submitting');
      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.btn-text');
      if(btnText) btnText.textContent = '送信中...';

      try {
        let success = false;
        if(apiUrl === 'mock' || apiUrl.startsWith('mock')) {
             await new Promise(resolve => setTimeout(resolve, 1500));
             success = true; // simulate success
        } else {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            success = response.ok;
        }

        if (success) {
          this.setAttribute('state', 'success');
          form.reset();
        } else {
          this.setAttribute('state', 'error');
        }
      } catch (error) {
        console.error('Submission error:', error);
        this.setAttribute('state', 'error');
      } finally {
        submitBtn.classList.remove('submitting');
        submitBtn.disabled = false;
        if(btnText) btnText.textContent = '送信する';
      }
    });
  }

  validateForm(form: HTMLFormElement): boolean {
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea');
    
    inputs.forEach((input) => {
      const el = input as HTMLInputElement;
      const isInputValid = el.checkValidity();
      
      if (!isInputValid) {
        el.classList.add('invalid');
        isValid = false;
      } else {
        el.classList.remove('invalid');
      }
      
      el.addEventListener('input', () => {
        el.classList.remove('invalid');
      }, { once: true });
    });

    return isValid;
  }
}

customElements.define('company-contact-form', CompanyContactForm);
