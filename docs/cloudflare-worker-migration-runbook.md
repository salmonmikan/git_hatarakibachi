# Cloudflare Pages → Workers 移行 Runbook

## 対象

- Production: `https://hatarakibachi.com`
- Staging: `https://staging.hatarakibachi.com`

## 通常デプロイ

GitHub Actions `Deploy` workflowが以下を実行する。

1. 対象SHAを確定
2. Supabase migration
3. Vite build
4. Worker runtime secretsを一時ファイル化
5. `wrangler deploy --env <staging|production>`
6. 公開URL smoke test
7. Sanity Studio deploy

Worker runtime Variables / SecretsはCloudflare Dashboardへ手入力せず、GitHub Environmentをsource of truthにする。

## GitHub Environment

staging / productionで同じキー名を使用する。

### Secrets

- `CLOUDFLARE_API_TOKEN`
- `SUPABASE_ANON_KEY`
- `SANITY_PREVIEW_SECRET`
- `VITE_SANITY_READ_TOKEN`

### Variables

- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_PROJECT_REF`
- `IMG_ORIGIN`

## Production cutover

64-3ではPages custom domainを削除しない。

`hatarakibachi.com/*` のWorker Routeを設定し、既存Pagesの前段でWorkerを実行する。

Production Worker deploy成功後に次を確認する。

- `/`
- `/about`
- `/api/web-members`
- `/api/web-sitenews?limit=1`
- preview cookie時の `X-Robots-Tag`
- preview cookie時の `Cache-Control`
- Admin login
- GA4/GTM
- Sanity preview/draft
- 画像表示

## Rollback

### アプリコードだけ問題がある場合

GitHub Actions `Deploy` を、mainに含まれる直前の正常SHAを指定してproductionへ再実行する。

### Worker自体を経路から外す場合

Pages project / Pages custom domainを残している期間は、Production Workerを削除してRouteを外せばPagesへ戻せる。

Cloudflare認証済みのローカルまたは承認済み運用端末から:

```bash
npx wrangler delete --env production
```

削除前に対象が `hatarakibachi-worker-production` であることを確認する。

Stagingの場合:

```bash
npx wrangler delete --env staging
```

## Pages退役前の禁止事項

64-4完了までは以下を行わない。

- Pages project削除
- Pages custom domain削除
- Pages DNS record削除
- Pages Git integrationの解除

これらはWorker RouteからPagesへ戻すrollback経路を失うため。

## Pages退役

安定確認後の64-4で:

1. WorkerをCustom Domainへ変更
2. Pages projectを削除
3. Pages Functions / Pages CIを削除
4. Worker-only構成へ一本化

を行う。
