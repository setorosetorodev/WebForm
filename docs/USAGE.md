# 問い合わせフォーム（Webパーツ） 利用マニュアル

本ドキュメントでは、開発した問い合わせフォーム（Web Components）を各種ランディングページ（LP）や外部サイトへ埋め込む手順について解説します。

## 1. ビルド（ファイル生成）

Webパーツを外部サイトで利用するためには、まずViteを使ってフロントエンドのコードを単一のJavaScriptファイルにビルド（最適化・結合）します。

```bash
cd frontend
npm run build
```

ビルドが完了すると、`frontend/dist/assets/` ディレクトリ内に `index-XXXXX.js` といったファイルが生成されます。このファイルがWebパーツの本体となります。
※将来的にCDN（Cloudflare Pages等）へデプロイした場合は、その公開URLを利用します。

## 2. 埋め込み方法

呼び出し側のHTMLファイル（LPなど）の任意の場所に、以下の2つの記述を追加するだけでフォームを埋め込むことができます。

### ① スクリプトの読み込み

HTMLの `<head>` 内、または `</body>` の直前に、生成されたJavaScriptファイル（またはCDNのURL）をモジュールとして読み込みます。

```html
<!-- 例: 同一サーバー内にスクリプトを配置した場合 -->
<script type="module" src="./assets/index-XXXXX.js"></script>

<!-- 例: Cloudflare Pages等のCDNから読み込む場合 -->
<!-- <script type="module" src="https://your-domain.pages.dev/assets/index.js"></script> -->
```

### ② カスタムタグの配置

フォームを表示したい場所に、`<company-contact-form>` タグを配置します。

```html
<!-- 最小限の構成（テスト用モック） -->
<company-contact-form api-url="mock"></company-contact-form>

<!-- 実運用時のフル構成 -->
<company-contact-form 
  api-url="https://api.your-domain.com/api/inquiries" 
  solution-id="lp-campaign-2026"
  require-consent="true">
</company-contact-form>
```

## 3. 属性（Attributes）の解説

`<company-contact-form>` タグには、以下の属性を設定して動作をカスタマイズできます。

| 属性名 | 必須 | 説明 | 設定例 |
| :--- | :---: | :--- | :--- |
| `api-url` | 〇 | フォーム送信先となるバックエンドAPIのエンドポイントURLです。`mock` を指定すると通信を行わずダミーで成功処理を行います。 | `https://api...` または `mock` |
| `solution-id` | - | どのLPからの問い合わせかを識別するためのIDです。APIへデータとして送信されます。 | `lp-summer-sale` |
| `require-consent`| - | `true` を指定すると、「個人情報保護方針に同意する」のチェックボックスが表示され、必須入力となります。 | `true` または未指定 |

## 4. スタイリングについて

本Webパーツは `Shadow DOM` を使用してカプセル化されているため、呼び出し側（LP）のCSSフレームワーク（Bootstrap, Tailwind等）の影響を一切受けません。
もしフォームの横幅などを制限したい場合は、呼び出し側のHTMLでラップするコンテナ要素で調整してください。

```html
<!-- 幅を600pxに制限して中央寄せする例 -->
<div style="max-width: 600px; margin: 0 auto;">
  <company-contact-form api-url="mock"></company-contact-form>
</div>
```
