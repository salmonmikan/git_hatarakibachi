# Cloudflare Workers 運用 Runbook

## 現行構成

Web/API配信はCloudflare Workers + Static Assetsへ一本化する。

- Production: `https://hatarakibachi.com`
- Staging: `https://staging.hatarakibachi.com`
- Worker entrypoint: `worker/index.ts`
- Static Assets: Vite `dist/`
- Production/Staging: Worker Custom Domain
- Deploy: GitHub Actions + Wrangler

Cloudflare Pagesは退役済みを前提とする。

## GitHub Environment

`staging` / `production` で同じキー名を使用し、値だけ環境別にする。

### Secrets

- `CLOUDFLARE_API_TOKEN`
- `SUPABASE_ANON_KEY`
- `SANITY_PREVIEW_SECRET`
- `VITE_SANITY_READ_TOKEN`
- `IMG_KEY`

### Variables

- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_PROJECT_REF`
- `IMG_ORIGIN`

`SUPABASE_URL` は `SUPABASE_PROJECT_REF` からdeploy workflow内で生成する。

## 通常デプロイ

GitHub Actions `Deploy` workflow:

1. 対象SHAを確定
2. Supabase migration
3. Vite build
4. Worker secretsを一時JSONへ生成
5. Wrangler deploy
6. Production/Staging URL smoke test
7. Sanity Studio deploy

Worker runtime Variables / SecretsはCloudflare Dashboardへ重複管理せず、GitHub Environmentをsource of truthにする。

## Worker routing

`wrangler.jsonc`:

- staging: `staging.hatarakibachi.com` Custom Domain
- production: `hatarakibachi.com` Custom Domain

SPA routingは `assets.not_found_handling = single-page-application` で処理する。

Preview cookie利用時はWorker middleware相当処理で:

- `Cache-Control: private, no-store`
- `X-Robots-Tag: noindex, nofollow`

を付与する。

## API

Worker entrypointが明示routingする。

- `/api/draft`
- `/api/disable-draft`
- `/api/web-members`
- `/api/web-sitenews`
- `/img/*`

未定義の `/api/*` はSPAへfallbackさせず404。

## ローカル確認

```bash
npm run lint
npm test
npm run build
npm run worker:check
npm run dev:worker
```

`dev:proxy` は後方互換のcommand名として `dev:worker` を呼ぶ。

## Rollback

### コード不具合

GitHub Actions `Deploy` を、対象environment branchに含まれる直前の正常SHAを指定して再実行する。

### Worker deployment確認

Cloudflare Worker deploymentsを確認し、必要に応じて正常versionへ戻す。

Pages退役後はPagesへのrollbackは行わない。

## Pages → Workers 一回限りの移行手順

履歴上の移行は以下の順序。

1. WorkerをPages前段のRouteとしてStagingへ展開
2. ProductionへRoute展開
3. 十分な安定確認
4. #67の `Retire Cloudflare Pages` workflowをmainから手動実行
5. Pages project削除
6. Production/StagingをWorker Custom Domain化
7. smoke test完了
8. #68をmergeしてPages固有コード/CIをcleanup

Pages custom domainにはCNAMEが存在するため、Pages削除前にWorker Custom Domainを作成しない。
