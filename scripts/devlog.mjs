#!/usr/bin/env node
/**
 * 開発日誌の一言を中央ストア(setorosetoro.com/api/devlog)へ POST する共通スクリプト。
 * 各プロジェクト(だすね・launchia・たまWEB・今後)の scripts/ に置いて使う。仕様: TamaDev50-WEB の docs/devlog-spec.md。
 *
 * 使い方:
 *   node scripts/devlog.mjs "<本文>" [mood] [--project=slug] [--author=claude] [--private] [--commit=<hash>] [--date=YYYY-MM-DD|ISO]
 * 例:
 *   node scripts/devlog.mjs "今日はXを直した" 🎉
 *   node scripts/devlog.mjs "過去の事例を後追い記録" 🛠️ --project=dasune --date=2025-11-20   # バックフィル
 *
 * 設定(コミットしない。各リポジトリの .dev.vars か .env、または環境変数):
 *   DEVLOG_WRITE_TOKEN  … 書き込みトークン(必須)
 *   DEVLOG_PROJECT      … このリポジトリの slug(例 dasune / launchia / tamadev50-web)。--project 省略時に使用
 *   DEVLOG_ENDPOINT     … 既定 https://setorosetoro.com/api/devlog
 */
import { readFileSync } from 'node:fs';

// .dev.vars / .env を簡易ロード(dotenv 不要)。既存の process.env を優先。
function loadLocalEnv() {
  for (const file of ['.dev.vars', '.env']) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const key = m[1];
      const val = m[2].replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined && val !== '') process.env[key] = val;
    }
  }
}
loadLocalEnv();

const args = process.argv.slice(2);
const flags = {};
const positional = [];
for (const a of args) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) flags[m[1]] = m[2] ?? true;
  else positional.push(a);
}

const body = positional[0];
const mood = positional[1];
if (!body) {
  console.error('使い方: node scripts/devlog.mjs "<本文>" [mood] [--project=slug] [--author=claude] [--private]');
  process.exit(1);
}

const endpoint = process.env.DEVLOG_ENDPOINT || 'https://setorosetoro.com/api/devlog';
const token = process.env.DEVLOG_WRITE_TOKEN;
if (!token) {
  console.error('DEVLOG_WRITE_TOKEN が未設定です(.dev.vars か環境変数で渡す。コミットしないこと)。');
  process.exit(1);
}
const project = flags.project || process.env.DEVLOG_PROJECT;
if (!project) {
  console.error('project slug が未指定です(--project=<slug> か .dev.vars の DEVLOG_PROJECT)。');
  process.exit(1);
}

// --date: 過去日のバックフィル用。YYYY-MM-DD は当日 00:00 UTC に展開、それ以外はそのまま送る(API が ISO 正規化)。
let createdAt = null;
const dateArg = flags.date ?? flags.at;
if (dateArg && dateArg !== true) {
  createdAt = /^\d{4}-\d{2}-\d{2}$/.test(dateArg) ? `${dateArg}T00:00:00.000Z` : dateArg;
}

const payload = {
  project,
  author: flags.author || 'claude',
  body,
  mood: mood || flags.mood || null,
  commit_hash: flags.commit || null,
  visibility: flags.private ? 'private' : 'public',
  created_at: createdAt,
};

const res = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  console.error(`POST 失敗: ${res.status} ${res.statusText}`);
  console.error(await res.text().catch(() => ''));
  process.exit(1);
}
const json = await res.json().catch(() => ({}));
const when = createdAt ? ` date=${createdAt.slice(0, 10)}(backfill)` : '';
console.log(`✓ devlog 投稿: id=${json.id ?? '?'} project=${payload.project} author=${payload.author}${when}`);
