# Square 団員費連携 Phase 1 実施計画

## 目的

月額1,000円の団員費をSquareサブスクリプションで徴収し、既存の劇団はたらきばちWebシステムで登録・入金状況を確認できる最小構成を追加する。

## 実装範囲

1. Supabaseに団員課金情報・月別入金履歴・Webhook処理履歴を追加する。
2. 既存団員へ登録トークンを払い出し、新規団員にも自動作成する。
3. Cloudflare Pages FunctionsからSquareホスト型Subscription Checkoutを発行する。
4. Square Webhookの署名を検証し、契約状態と入金成功・失敗をSupabaseへ同期する。
5. 公開サイトへ団員専用の登録画面と完了画面を追加する。公開ナビには掲載しない。
6. Adminへ団員費管理画面を追加し、登録リンクの発行状況と今月の入金状態を確認できるようにする。
7. 必要な外部環境変数・Webhook設定をドキュメント化する。

## 設計方針

- カード情報は劇団サイトで扱わずSquareへ委譲する。
- Square SDKは追加せず、既存Pages Functionsの方針に合わせてFetch APIを使う。
- Webhook署名はWeb Crypto APIのHMAC-SHA256で検証する。
- Webhookの `event_id` を保存し、Squareの再送による二重計上を防止する。
- 団員費のPlan Variation IDを確認し、他のSquareサブスクリプションを団員費として取り込まない。
- 課金テーブルは公開せず、Adminは既存 `admin_users` に基づくRLSで閲覧する。
- Phase 1ではPause / Resume / Cancel API連動を実装しない。

## 検証

PRで既存CIを実行し、以下を確認する。

- ESLint
- Vite build
- Cloudflare Pages Functions build
- Sanity Studio build
- Supabaseの全Migration再適用
