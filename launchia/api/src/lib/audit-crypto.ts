import type { Env } from '../env'

/**
 * 監査ログの宛先メールを可逆暗号化する（AES-256-GCM）。
 * 保存形式: base64( iv(12B) ‖ ciphertext+tag )。鍵 AUDIT_ENC_KEY は 32バイトを base64 化したもの。
 * （neon-http は bytea の読み戻しが曖昧なため、決定的な base64 TEXT で保存する。）
 * 鍵未設定なら暗号化はスキップ（null を返す）＝監査行は記録するが宛先は残さない。
 * 既定はマスク表示。復号はシステム管理者の明示操作のみで使う。
 */

const IV_LENGTH = 12

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = base64ToBytes(base64Key)
  if (raw.length !== 32) {
    throw new Error(`AUDIT_ENC_KEY must decode to 32 bytes (got ${raw.length})`)
  }
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

/** 平文メール → 暗号文（base64 文字列）。鍵未設定 or 入力なしなら null。 */
export async function encryptEmail(
  env: Env,
  plaintext: string | null | undefined,
): Promise<string | null> {
  if (!env.AUDIT_ENC_KEY || !plaintext) return null
  const key = await importKey(env.AUDIT_ENC_KEY)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const data = new TextEncoder().encode(plaintext)
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))
  const out = new Uint8Array(iv.length + ct.length)
  out.set(iv, 0)
  out.set(ct, iv.length)
  return bytesToBase64(out)
}

/** 暗号文（base64 文字列）→ 平文メール。鍵未設定 or 入力なし or 復号失敗なら null。 */
export async function decryptEmail(
  env: Env,
  b64: string | null | undefined,
): Promise<string | null> {
  if (!env.AUDIT_ENC_KEY || !b64) return null
  try {
    const bytes = base64ToBytes(b64)
    if (bytes.length <= IV_LENGTH) return null
    const key = await importKey(env.AUDIT_ENC_KEY)
    const iv = bytes.slice(0, IV_LENGTH)
    const ct = bytes.slice(IV_LENGTH)
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    return new TextDecoder().decode(pt)
  } catch (err) {
    console.error('decryptEmail failed:', err)
    return null
  }
}

/** 各ラベルの先頭/末尾だけ残して中間を伏せる（例 "setorosetorodev" → "s***v"）。 */
function maskLabel(label: string): string {
  if (label.length <= 1) return label
  if (label.length === 2) return `${label[0]}*`
  return `${label[0]}${'*'.repeat(Math.min(label.length - 2, 3))}${label[label.length - 1]}`
}

/** メールをマスク表示（例 "setorosetorodev@gmail.com" → "s***v@g***l.c*m"）。 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 0) return maskLabel(email)
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const maskedDomain = domain.split('.').map(maskLabel).join('.')
  return `${maskLabel(local)}@${maskedDomain}`
}
