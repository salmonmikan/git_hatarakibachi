# CI/CD運用

## Workers staging統合

stagingではdatabase成功後にWorkerをdeployし、CMSも同じSHAからdeployします。既存のPages frontendジョブはproductionだけに限定し、staging Worker配信との二重deployを避けます。

Workerはstaging既存の署名付きプレビューとサーバー側Sanity proxyを維持します。SANITY_PREVIEW_SECRETとSANITY_PREVIEW_READ_TOKENはGitHub Environment stagingのSecretsで管理し、配備ジョブがrunnerの一時JSONファイルから--secrets-fileでWorker runtimeへ渡します。値は表示せず、frontend buildへは渡しません。IMG_ORIGINもGitHub VariableからWorkerへ渡します。SANITY_DATASETはstagingを明示します。--keep-varsで今回管理しないWorker側Variablesを保持し、GitHubから指定した項目を更新します。設定値や登録状態は参照していません。

CIでは通常アクセス、有効な署名、偽造・改ざん・設定欠落、preview proxyのPOST制限を検証します。実環境smoke testでは公開ページとAPIを確認し、正当なプレビューはStudioからの確認が必要です。

stagingへのpushでは、CIの検証成功後に同じコミットのDeployをworkflow_callで呼び出します。呼び出されたworkflowのgithub contextは呼び出し元のpushを保持します。各配備ジョブはGitHub Environment stagingを指定し、そのVariables/Secretsを利用します。DB接続・migration失敗時にはWorkerとCMSを配備しません。Deploy対象SHAはstagingに含まれるSHAに限定します。

staging側のCI名をCI and staging deployへ変更し、main側の旧workflow_run（CI監視）による二重配備を避けます。mainのファイルは変更しません。staging pushの実行は後続pushでキャンセルせず、Deployは既存のconcurrencyで直列化します。PRでは配備を実行しません。

GitHubのSettings → Environments → stagingで、WorkerはSecret CLOUDFLARE_API_TOKENとVariables SUPABASE_PROJECT_REF、VITE_SUPABASE_ANON_KEYを利用します。Supabase URLはProject Refから生成し、buildのVITE_SUPABASE_URLとruntimeのSUPABASE_URLへ同じURLを渡します。Cloudflareの公開Account IDはwrangler.jsoncのenv.staging.account_idへ固定します。stagingでCLOUDFLARE_ACCOUNT_IDとVITE_SUPABASE_URLの手動登録は不要です。Worker用プレビューSecretsとIMG_ORIGINも同じGitHub Environmentに登録します。staging DBはSUPABASE_DB_URLのSession pooler接続を使います。productionのlink経路ではSUPABASE_ACCESS_TOKEN、SUPABASE_DB_PASSWORDを使います。値や登録状態をエージェントへ共有しないでください。

### stagingの登録項目

以下は現在のstaging配備で必要な10項目です。IMG_KEYはSTG/PROD共通のGitHub Repository Secretに1回登録し、それ以外の9項目はGitHub Environment stagingに登録します。Cloudflareへの手動二重登録は不要です。

| 名前 | 種別 | 取得先・用途 |
| --- | --- | --- |
| CLOUDFLARE_API_TOKEN | Secret | Cloudflare API Tokens。Workerと対象zoneへ配備できるtoken |
| VITE_SUPABASE_ANON_KEY | Variable | Supabase STG projectのSettings → API Keys。公開用anon key |
| SUPABASE_PROJECT_REF | Variable | Supabase STG project ID |
| SUPABASE_DB_URL | Secret | Supabase STG projectのConnect → Session pooler。passwordを含む接続URL、port 5432 |
| SANITY_AUTH_TOKEN | Secret | Sanity projectのStudio配備用token |
| SANITY_STUDIO_APP_ID | Variable | Sanity projectのStudiosにあるSTG用Studio App ID |
| SANITY_PREVIEW_SECRET | Secret | 手元で生成した十分に長いランダム値。preview cookieの署名用 |
| SANITY_PREVIEW_READ_TOKEN | Secret | Sanity STGのdraftを読めるtoken |
| IMG_ORIGIN | Variable | 既存画像配信元URL。画像proxyの転送先 |
| IMG_KEY | Repository Secret（共通） | 既存の画像配信元が要求する共通認証キー。名前を維持してWorker runtimeへ配備 |

IMG_KEYは`/img/*`の画像proxyで使用し、上流画像リクエストの認証にだけ渡します。欠落時は503で停止し、frontend buildへ渡しません。登録先はGitHub Settings → Secrets and variables → Actions → Repository secretsです。Cloudflareで使用している共通キーをIMG_KEYとして手元で登録してください。workflowのsecrets.IMG_KEYとruntimeのenv.IMG_KEYを共通名として維持します。Environmentに同名のSecretを登録するとそちらが優先されるため、staging/productionへ重複登録しません。既存Secretの値を取得・比較・コピーしたり、登録を削除したりする操作は行っていません。本番の配備経路は変更していません。

現在のstagingにはTurnstile実装は未統合ですが、Ticket予約統合PR #59で利用予定です。PR #59の統合時には、次の3項目をGitHub Environment stagingへ追加し、公開Site Keyをfrontend build、SecretsをWorker runtimeへ渡す必要があります。Workerの予約APIルートも統合対象です。設定の追加だけでは予約APIは動作しません。

| 統合時に追加する名前 | 種別 | 用途 |
| --- | --- | --- |
| VITE_TURNSTILE_SITE_KEY | Variable | Turnstile widgetの公開Site Key |
| TURNSTILE_SECRET_KEY | Secret | サーバー側Siteverifyの認証 |
| SUPABASE_SERVICE_ROLE_KEY | Secret | 予約APIのサーバー専用認証。公開用anon keyと共有しない |

PR #59統合後は登録13項目となります。Turnstileの公開キーとSecret、Supabase公開用とサーバー用、Sanity配備用とdraft読取用は用途・権限が異なるため共有しません。VITE_SANITY_READ_TOKENは現在のfrontendでは参照せず、draft読取はSANITY_PREVIEW_READ_TOKENを使用します。IMG_ORIGINは配信元が未確定のため推測せず、GitHub Variableのまま維持します。

VITE_SUPABASE_URL、SUPABASE_URL、SUPABASE_ANON_KEY、SANITY_DATASETとSANITY_STUDIO_DEPLOY_ENVはworkflowが対応付け・設定するため、手動登録しません。stagingでは標準のhttps://<project-ref>.supabase.coを使用します。将来カスタムAPIドメインを採用する場合はURL生成を変更する必要があります。SANITY_DEPLOY_GRAPHQLは任意で、通常は未設定のままGraphQL配備を行いません。production Pagesの既存Account IDとURL設定はこの集約では変更しません。

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

CMSのbuild/deployではSANITY_STUDIO_DEPLOY_ENVをworkflowの対象Environmentから設定し、workspaceとCLI datasetをその環境に限定します。staging配備でproduction schemaを更新しません。配備先app IDの検証と実配備は別工程として記録し、設定不足とCLI配備失敗を区別します。app IDを推測したり、既存の本番Studioをstaging配備先として流用したりしません。

GraphQLは既存の `sanity-studio/package.json` にある `deploy-graphql` scriptを利用できますが、現行のCLI設定にはGraphQL API定義がなく、フロントエンドもSanity client/GROQ経由で取得しています。そのため通常は実行せず、手動実行の `deploy_graphql` またはEnvironment Variable `SANITY_DEPLOY_GRAPHQL=true` の明示指定時だけ実行します。GraphQL APIを利用する場合は、API定義・schema差分・互換性をレビューしてから有効化します。

Frontendジョブはルートの `dist/` をWranglerでPagesへ直接uploadします。preview時のSanity read tokenはVite buildへ渡さず、`/api/sanity-preview` Pages Functionのruntime secret `SANITY_PREVIEW_READ_TOKEN` だけで保持します。checkout後に解決した実SHAを `--commit-hash` へ渡し、production/stagingともEnvironmentの `CLOUDFLARE_PAGES_BRANCH` を `--branch` へ明示します。リポジトリ直下の `functions/` はPages Functionsの規約に従う配置なので、同じPages deployの対象になります。公開後は`PUBLIC_BASE_URL`のトップページと`/api/draft`を確認し、静的PagesとFunctionsの両方が応答することを成功条件にします。

Preview用の `SANITY_PREVIEW_SECRET` と `SANITY_PREVIEW_READ_TOKEN` は、staging WorkerではGitHub Secretsから配備し、productionのCloudflare Pages Functionsではruntime secretとして設定します。frontend bundleへは値を渡しません。各Cloudflare Pages Environmentには、対象datasetを表すruntime Variable `SANITY_DATASET`（`staging` または `production`）を設定します。未知のPages hostnameではこのVariableなしにproductionへfallbackせず、previewを503で停止します。Sanity Presentation Toolが認証済みStudioセッションから生成したPreview URL Secretを `/api/draft` がSanity APIでサーバー側検証し、検証成功時だけ署名付き・期限付きpreview cookieを1時間発行します。`/api/sanity-preview` はそのcookieを検証してdraft queryをSanityへproxyします。再利用可能なPreview SecretをStudioの設定やclient bundleへ埋め込まないでください。

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
