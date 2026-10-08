# CI/CD運用

## Workers staging統合

stagingではdatabase成功後にWorkerをdeployし、CMSも同じSHAからdeployします。既存のPages frontendジョブはproductionだけに限定し、staging Worker配信との二重deployを避けます。

Workerはstaging既存の署名付きプレビューとサーバー側Sanity proxyを維持します。SANITY_PREVIEW_READ_TOKENはGitHub Environment stagingのSecretからWorker runtimeだけへ渡し、frontend buildへは渡しません。SANITY_DATASETはstagingを明示します。設定値や登録状態は参照していません。

CIでは通常アクセス、有効な署名、偽造・改ざん・設定欠落、preview proxyのPOST制限を検証します。実環境smoke testでは公開ページとAPIを確認し、正当なプレビューはStudioからの確認が必要です。

stagingへのpushでは、CIの検証成功後に同じコミットのDeployをworkflow_callで呼び出します。呼び出されたworkflowのgithub contextは呼び出し元のpushを保持します。各配備ジョブはGitHub Environment stagingを指定し、そのVariables/Secretsを利用します。DB接続・migration失敗時にはWorkerとCMSを配備しません。Deploy対象SHAはstagingに含まれるSHAに限定します。

staging側のCI名をCI and staging deployへ変更し、main側の旧workflow_run（CI監視）による二重配備を避けます。mainのファイルは変更しません。staging pushの実行は後続pushでキャンセルせず、Deployは既存のconcurrencyで直列化します。PRでは配備を実行しません。

GitHubのSettings → Environments → stagingで、Worker用VariablesにCLOUDFLARE_ACCOUNT_ID、SUPABASE_PROJECT_REF、IMG_ORIGINを、SecretsにCLOUDFLARE_API_TOKEN、SUPABASE_ANON_KEY、SANITY_PREVIEW_SECRET、SANITY_PREVIEW_READ_TOKENを登録します。DB用SecretsはSUPABASE_ACCESS_TOKEN、SUPABASE_DB_PASSWORDです。CMS用は後述のSANITY_AUTH_TOKENとSANITY_STUDIO_APP_IDです。値や登録状態をエージェントへ共有しないでください。

Link Supabase project失敗時は、管理者がstagingのSUPABASE_PROJECT_REFをhrecrzpxzvrjxhuiitrnと照合し、Supabase Dashboardでアクセストークンの対象projectへの権限、DB password、Network Restrictionsを確認してください。接続失敗だけではDB停止やSQL不整合を判断できません。設定を修正した場合は失敗したstaging実行を再実行します。認証値やログ全文をIssueへ貼り付けないでください。

Issue #41で追加したGitHub Actionsの運用境界と、初回設定に必要な項目を記載します。

## Workflow

- `.github/workflows/ci.yml`
  - `pull_request` と `main` / `staging` への `push` で実行。
  - `.nvmrc` の Node.js 22.17.0 と npm 10.9.2 を使用し、rootと`sanity-studio`の`npm ci`、lint、build、Pages Functions bundle、Supabase migrationの命名・ローカル再適用を検証。
  - PRの古い実行は同じConcurrency group内でキャンセルする。
- `.github/workflows/deploy.yml`
  - stagingではCI成功後の `workflow_call`、mainでは既存の `workflow_run`、手動では `workflow_dispatch` で実行。自動DeployはCI失敗時には起動しない。
  - stagingでは `database` → `worker-staging` / `cms`、productionでは `database` → `cms` → `frontend` のジョブ依存で順序を固定する。各ジョブが失敗した場合、後続ジョブは実行しない。
  - `main` は `production`、`staging` は `staging` に割り当てる。手動実行ではEnvironmentを選択できる。
  - 最初に指定`ref`を実SHAへ解決し、database・cms・frontendの全ジョブは同じSHAをcheckoutする。`ref` にコミットSHAを指定すると、同じSHAの再実行ができる。適用済みのSupabase migrationは履歴により再適用されない。
  - 手動実行の対象SHAは、productionでは`main`、stagingでは`staging`に含まれるcommitだけを許可する。
  - 同じEnvironmentのDeployはConcurrencyで直列化し、実行中のDeployをキャンセルしない。

## 初回有効化

`workflow_run`は既定ブランチmainのDeploy定義を使用します。stagingの自動配備はこの制約を避けて同じコミットのworkflowを呼び出すため、mainへの統合前にも実行できます。GitHub Environmentと外部サービス設定は配備前に管理者が登録してください。手動Deployも既定ブランチに存在するworkflowを選択し、stagingのrefを指定して実行できます。

初回の`main`リリースはproduction Deployを起動するため、マージ前にproduction EnvironmentのRequired reviewersと全Secrets/Variablesを設定し、同じ変更内容がstagingで検証済みであることを承認者が確認します。

## GitHub Environment設定

GitHubリポジトリに `staging` と `production` Environmentを作成します。productionにはRequired reviewersを設定し、必要に応じてstagingにも設定します。各EnvironmentのSecrets/Variablesは、値をリポジトリへ記録せずGitHub UIで登録します。

Deployのdatabase・worker-staging・cms・frontendは対象Environmentに紐づくため、Required reviewerは保護対象ジョブごとに適用されます。EnvironmentのSecretsは各ジョブから利用します。

### Secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SANITY_AUTH_TOKEN`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

### Variables

- `CLOUDFLARE_PAGES_PROJECT`
- `CLOUDFLARE_PAGES_BRANCH`（staging/productionとも必須。各EnvironmentのPages branchを設定）
- `PUBLIC_BASE_URL`（公開後smoke test対象のEnvironment別URL）
- `SUPABASE_PROJECT_REF`
- `VITE_SUPABASE_URL`（Frontendで使用する対象EnvironmentのSupabase URL）
- `VITE_SUPABASE_ANON_KEY`（Frontendで使用する対象Environmentの公開用anon keyまたはpublishable key）
- `SANITY_STUDIO_APP_ID`（staging/productionで別々のSanity Studio deployment app IDを設定）
- `SANITY_DEPLOY_GRAPHQL`（`true`の場合だけ自動Deploy時にもGraphQLをdeploy）

CloudflareのアカウントIDとAPI token、Sanity token、Supabase token/passwordはSecretsからのみ受け取ります。Frontendへ配布するSupabase URLと公開用anon keyまたはpublishable keyはEnvironment Variablesからbuildへ渡します。workflowはSecretsの値をechoせず、権限も `contents: read` に限定しています。

## CMSとGraphQL

CMSジョブはSanity Studioの依存関係を `sanity-studio/package-lock.json` から `npm ci` し、Preview用SecretをBuildへ渡さずに `npm run build` 後、workflowから `sanity deploy --no-build --schema-required` を実行します。`SANITY_STUDIO_APP_ID`は対象Environmentごとに必須で、staging/productionは別のdeployment app IDへdeployします。schema公開失敗を警告で通過させないため、workflow側で `--schema-required` を明示しています。

GraphQLは既存の `sanity-studio/package.json` にある `deploy-graphql` scriptを利用できますが、現行のCLI設定にはGraphQL API定義がなく、フロントエンドもSanity client/GROQ経由で取得しています。そのため通常は実行せず、手動実行の `deploy_graphql` またはEnvironment Variable `SANITY_DEPLOY_GRAPHQL=true` の明示指定時だけ実行します。GraphQL APIを利用する場合は、API定義・schema差分・互換性をレビューしてから有効化します。

Frontendジョブはルートの `dist/` をWranglerでPagesへ直接uploadします。preview時のSanity read tokenはVite buildへ渡さず、`/api/sanity-preview` Pages Functionのruntime secret `SANITY_PREVIEW_READ_TOKEN` だけで保持します。checkout後に解決した実SHAを `--commit-hash` へ渡し、production/stagingともEnvironmentの `CLOUDFLARE_PAGES_BRANCH` を `--branch` へ明示します。リポジトリ直下の `functions/` はPages Functionsの規約に従う配置なので、同じPages deployの対象になります。公開後は`PUBLIC_BASE_URL`のトップページと`/api/draft`を確認し、静的PagesとFunctionsの両方が応答することを成功条件にします。

Preview用の `SANITY_PREVIEW_SECRET` と `SANITY_PREVIEW_READ_TOKEN` はCloudflare Pages Functionsのruntime secretとして設定し、GitHub Actionsやfrontend bundleへ値を渡しません。各Cloudflare Pages Environmentには、対象datasetを表すruntime Variable `SANITY_DATASET`（`staging` または `production`）を設定します。未知のPages hostnameではこのVariableなしにproductionへfallbackせず、previewを503で停止します。Sanity Presentation Toolが認証済みStudioセッションから生成したPreview URL Secretを `/api/draft` がSanity APIでサーバー側検証し、検証成功時だけ署名付き・期限付きpreview cookieを1時間発行します。`/api/sanity-preview` はそのcookieを検証してdraft queryをSanityへproxyします。再利用可能なPreview SecretをStudioの設定やclient bundleへ埋め込まないでください。

## Supabase migrationの安全策

Databaseジョブは次の順で実行します。

1. Environmentの認証情報で対象プロジェクトへlinkする。
2. `supabase migration list --password` でリモートmigration履歴を表示する。
3. `supabase db push --dry-run --linked --password` で適用候補を確認する。
4. `supabase db push --linked --password --yes` で、成功済みdry-runの後にmigrationを非対話で適用する。
5. `supabase migration list --password` を再実行し、適用後のリモート履歴を確認する。

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
