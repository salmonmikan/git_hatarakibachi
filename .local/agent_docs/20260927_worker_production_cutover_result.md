# Issue #64 64-3: Production Worker cutover 実装結果

## 実装

- `wrangler.jsonc` に `env.production` を追加。
  - `hatarakibachi.com/*` をWorker Routeとして設定。
  - Pages custom domain / DNSを残したままWorkerを前段化する。
- Deploy workflowのstaging専用Worker jobをstaging/production共通jobへ統合。
  - GitHub Environmentを自動選択。
  - 環境別Supabase/Sanity build。
  - Worker secrets / vars反映。
  - deploy後の環境別smoke test。
- CIへProduction Worker dry-run buildを追加。
- `docs/cloudflare-worker-migration-runbook.md` を追加。

## Production GitHub Environment

キー名はstagingと共通。

Secrets:
- `CLOUDFLARE_API_TOKEN`
- `SUPABASE_ANON_KEY`
- `SANITY_PREVIEW_SECRET`
- `VITE_SANITY_READ_TOKEN`

Variables:
- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_PROJECT_REF`
- `IMG_ORIGIN`

## Rollback

Pagesを64-4まで残すことで、Worker Routeを外した場合に既存Pagesへ戻せる。

## 非対象

- Pages project削除
- Worker Custom Domain化
- Ticket/Square新機能投入

これらは64-4または後続PRで行う。
