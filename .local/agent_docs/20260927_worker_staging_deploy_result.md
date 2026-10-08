# Issue #64 64-2: Staging Worker deploy / GitHub Actions統合 実装結果

## 実装内容

- `wrangler.jsonc` に `env.staging` を追加。
  - Worker名はWranglerの環境規則に従い `hatarakibachi-worker-staging`。
  - `staging.hatarakibachi.com/*` をWorker Routeとして設定。
  - 既存PagesのDNS/custom domainは残し、Worker Routeを前段に重ねるためrollback可能。
- GitHub Actions `Deploy` に `worker-staging` jobを追加。
  - GitHub Environment `staging` を利用。
  - Vite frontendをstaging用Supabase/Sanity値でbuild。
  - Worker runtime secretを一時JSONへ生成し、`wrangler deploy --secrets-file`でcodeと同時に反映。
  - runtime variableはdeploy時の `--var` で注入。
  - deploy後に公開URLのsmoke testを実行。
- CIへ `wrangler deploy --env staging --dry-run` を追加。

## GitHub Environment staging に必要な設定

### Secret

- `CLOUDFLARE_API_TOKEN`
- `SUPABASE_ANON_KEY`
- `SANITY_PREVIEW_SECRET`
- `VITE_SANITY_READ_TOKEN`

### Variable

- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_PROJECT_REF`（既存DB deployでも使用）
- `IMG_ORIGIN`

`SUPABASE_URL` は追加せず、`SUPABASE_PROJECT_REF` から
`https://<project-ref>.supabase.co`
として自動生成する。

## Cloudflare管理項目削減

Workerのruntime Variables / SecretsはCloudflare Dashboardをsource of truthにせず、GitHub EnvironmentからWrangler deploy時に反映する。

Cloudflare側で恒常的に手管理する対象は主に以下へ限定する。

- Account / Zone
- Worker Route
- WAF / Turnstile等のzone-level設定
- Workerそのもの

## Staging切替方式

StagingではPages custom domainを先に削除しない。

`staging.hatarakibachi.com/*` のWorker Routeを追加し、Workerが全リクエストを処理する。
問題発生時はWorker Routeを外すことで既存Pagesへ戻せる構成とする。

## Smoke test

deploy後にGitHub Actionsから以下を確認する。

- `/`
- `/about` SPA direct route
- `/api/web-members`
- `/api/web-sitenews?limit=1`
- preview cookie付き `/about`
  - `X-Robots-Tag: noindex, nofollow`
  - `Cache-Control: private, no-store`

## 未実施

PR時点ではGitHub Environmentの実値を変更せず、実Staging deployはstaging branchへの反映または明示workflow_dispatch時に実行する。
Production routeは64-3で追加する。
