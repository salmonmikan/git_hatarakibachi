# CI/CD運用

Issue #41で追加したGitHub Actionsの運用境界と、初回設定に必要な項目を記載します。

## Workflow

- `.github/workflows/ci.yml`
  - `pull_request` と `main` / `develop` への `push` で実行。
  - `.nvmrc` の Node.js 22.17.0 と npm 10.9.2 を使用し、rootと`sanity-studio`の`npm ci`、lint、buildを実行。
  - PRの古い実行は同じConcurrency group内でキャンセルする。
- `.github/workflows/deploy.yml`
  - `main` / `develop` のCI成功を受けた `workflow_run` と `workflow_dispatch` で実行。自動DeployはCI失敗時には起動しない。
  - `database` → `cms` → `frontend` のジョブ依存で順序を固定する。各ジョブが失敗した場合、後続ジョブは実行しない。
  - `main` は `production`、`develop` は `staging` に割り当てる。手動実行ではEnvironmentを選択できる。
  - `ref` にコミットSHAを指定すると、同じSHAの再実行ができる。適用済みのSupabase migrationは履歴により再適用されない。
  - 同じEnvironmentのDeployはConcurrencyで直列化し、実行中のDeployをキャンセルしない。

## GitHub Environment設定

GitHubリポジトリに `staging` と `production` Environmentを作成します。productionにはRequired reviewersを設定し、必要に応じてstagingにも設定します。各EnvironmentのSecrets/Variablesは、値をリポジトリへ記録せずGitHub UIで登録します。

Deployの3ジョブはすべて対象Environmentに紐づくため、productionのRequired reviewerは保護対象ジョブごとに適用されます。承認済みEnvironmentのSecretsだけがそのジョブへ渡ります。

### Secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SANITY_AUTH_TOKEN`
- `SANITY_STUDIO_PREVIEW_SECRET`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

### Variables

- `CLOUDFLARE_PAGES_PROJECT`
- `CLOUDFLARE_PAGES_BRANCH`（staging/productionとも必須。各EnvironmentのPages branchを設定）
- `SUPABASE_PROJECT_REF`
- `SANITY_DEPLOY_GRAPHQL`（`true`の場合だけ自動Deploy時にもGraphQLをdeploy）

CloudflareのアカウントIDとAPI token、Sanity token、Supabase token/passwordはSecretsからのみ受け取ります。workflowはSecretsの値をechoせず、権限も `contents: read` に限定しています。

## CMSとGraphQL

CMSジョブはSanity Studioの依存関係を `sanity-studio/package-lock.json` から `npm ci` し、Environmentの `SANITY_STUDIO_PREVIEW_SECRET` をBuildへ渡して `npm run build` 後にworkflowから `sanity deploy --no-build --schema-required` を実行します。schema公開失敗を警告で通過させないため、workflow側で `--schema-required` を明示しています。

GraphQLは既存の `sanity-studio/package.json` にある `deploy-graphql` scriptを利用できますが、現行のCLI設定にはGraphQL API定義がなく、フロントエンドもSanity client/GROQ経由で取得しています。そのため通常は実行せず、手動実行の `deploy_graphql` またはEnvironment Variable `SANITY_DEPLOY_GRAPHQL=true` の明示指定時だけ実行します。GraphQL APIを利用する場合は、API定義・schema差分・互換性をレビューしてから有効化します。

Frontendジョブはルートの `dist/` をWranglerでPagesへ直接uploadします。preview時のSanity read tokenはVite buildへ渡さず、`/api/sanity-preview` Pages Functionのruntime secret `SANITY_PREVIEW_READ_TOKEN` だけで保持します。checkout後に解決した実SHAを `--commit-hash` へ渡し、production/stagingともEnvironmentの `CLOUDFLARE_PAGES_BRANCH` を `--branch` へ明示します。リポジトリ直下の `functions/` はPages Functionsの規約に従う配置なので、同じPages deployの対象になります。

Preview用の `SANITY_PREVIEW_SECRET` と `SANITY_PREVIEW_READ_TOKEN` はCloudflare Pages Functionsのruntime secretとして設定し、GitHub Actionsやfrontend bundleへ値を渡しません。`/api/draft` が署名付きpreview cookieを発行し、`/api/sanity-preview` がそのcookieを検証してdraft queryをSanityへproxyします。

## Supabase migrationの安全策

Databaseジョブは次の順で実行します。

1. Environmentの認証情報で対象プロジェクトへlinkする。
2. `supabase migration list` でリモートmigration履歴を表示する。
3. `supabase db push --dry-run --linked` で適用候補を確認する。
4. `supabase db push --linked` でmigrationを適用する。

Migration historyのrepairや自動rollbackはworkflowに組み込みません。失敗時はSQLと履歴を確認し、必要なら承認済みSupabase backup/recovery pointから復旧したうえで、履歴を壊さないforward-fix migrationを追加します。復旧判断後、`workflow_dispatch` の同じ `ref`（SHA）を指定して再実行します。migration適用前のバックアップ取得・保持期間・復旧操作はSupabase側の運用設定で別途確定してください。

## ローカル検証

外部サービスへ接続せず、次を実行します。

```bash
npm ci
npm run lint
npm run build

cd sanity-studio
npm ci
npm run build
```

Supabaseのmigrationファイルは `supabase/migrations/` に時系列で管理されています。リモート履歴は認証情報を参照しないローカル検証では確認できないため、Deploy workflowのlink後の `migration list` とdry-runを正本の確認手段とします。
