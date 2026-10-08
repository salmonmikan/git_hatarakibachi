# Issue #64 64-2: Staging Worker deploy / GitHub Actions統合 計画

## 目的

64-1で追加したWorkers + Static Assets基盤を、実際のCloudflare Staging Workerへデプロイ可能にする。

## 主な変更予定

- GitHub ActionsからWranglerでStaging Workerをdeploy
- GitHub Environment `staging` を設定source of truthとして利用
- Cloudflare deploy用credentialの整理
- Staging WorkerのVariables / Secrets同期
- workers.dev またはstaging domainでE2E確認
- 既存Pages本番は変更しない

## GitHub Environment

### Secrets

- `CLOUDFLARE_API_TOKEN`

### Variables

- `CLOUDFLARE_ACCOUNT_ID`

Worker名などコードで固定可能な値はWranglerへ寄せ、GitHub Variablesを増やしすぎない。

## Staging Runtime設定

現行mainで必要な設定を先に移行し、Ticket/Square用設定は#59/#60をWorker版へ載せる段階で追加する。

## 検証

- Worker staging deploy
- Static assets
- SPA direct route
- preview/draft
- web-members
- web-sitenews
- image proxy
- Admin login
- GitHub Actions再実行による再現性

## 非対象

- Production custom domain切替
- Pages停止
- Ticket/Square本番リリース
