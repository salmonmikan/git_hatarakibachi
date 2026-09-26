# Issue #64 64-3: Production Worker cutover 計画

## 目的

64-2で実装したStaging Worker deployをProductionへ拡張し、
`hatarakibachi.com` の本番トラフィックをCloudflare PagesからWorker + Static Assetsへ切り替える。

## 切替方式

Production Pages custom domain / DNSは先に削除しない。

`hatarakibachi.com/*` のWorker Routeを追加して、
既存Pagesの前段でWorkerが全リクエストを処理する。

これにより、問題発生時はWorkerを削除またはrouteを外すことでPagesへ戻せる。

## 変更

- `wrangler.jsonc`
  - `env.production`
  - `hatarakibachi.com/*` Worker Route
- GitHub Actions Deploy
  - staging / production共通Worker job
  - GitHub Environmentを環境ごとに使用
  - environment-specific build / runtime vars
  - deploy後smoke test
- CI
  - production dry-run build追加
- Production rollback runbook追加

## GitHub Environment production

stagingと同じキー名を使用し、値だけProduction用へ分離する。

### Secrets

- `CLOUDFLARE_API_TOKEN`
- `SUPABASE_ANON_KEY`
- `SANITY_PREVIEW_SECRET`
- `VITE_SANITY_READ_TOKEN`

### Variables

- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_PROJECT_REF`
- `IMG_ORIGIN`

## 非対象

- Pages project削除
- Pages Git integration削除
- Ticket #59 / Square #60
- Worker Custom Domainへの最終変換

上記は64-4または後続Stackで行う。
