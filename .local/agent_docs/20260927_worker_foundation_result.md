# Issue #64 64-1: Workers + Static Assets 移行基盤 実装結果

## 実装

- `wrangler.jsonc` を追加。
  - Worker entrypoint: `worker/index.ts`
  - Static Assets: `dist/`
  - `ASSETS` binding
  - `run_worker_first: true`
  - `not_found_handling: "single-page-application"`
  - compatibility date: `2026-06-10`
- `worker/index.ts` を追加し、既存Pages Functions handlerを再利用。
- `worker/routes.js` でAPI / image / asset routingを明示化。
- Pages互換のためAPI route末尾スラッシュを正規化。
- `worker/routes.test.js` を追加。
- `npm test` / `dev:worker` / `worker:check` を追加。
- CIでPages Functions buildとWorker dry-run buildを並行検証。
- `worker:check` は生成物をリポジトリ配下へ残さない構成に変更し、後続lintへ影響しないようにした。

## レビュー対応

Codex指摘に対して以下を修正。

1. SPA direct routeが404になる問題
   - Workers Static AssetsのSPA fallbackを明示。
2. unsupported compatibility date
   - 現在lockされているworkerdで利用可能な日付へ修正。
3. API route末尾スラッシュ互換
   - pathnameを正規化しテスト追加。
4. 計画・実装結果ドキュメント不足
   - 本ファイルと対応するplanを追加。
5. Worker dry-run artifactをlintが拾う問題
   - persistent outdirを廃止。

## 検証結果

初回CI #233:
- ESLint: success
- Node tests: success
- Vite build: success
- Pages Functions build: success
- Worker dry-run build: success
- Sanity build: success
- fresh Supabase migration: success

レビュー修正後の最新HEADでも同一CIを再実行して最終確認する。

## 本PRで未実施

- Workerへの実deploy
- custom domain切替
- Cloudflare/GitHub Secrets追加
- Pages停止/削除
- Ticket #59 / Square #60のWorker移植
