# Issue #64 64-4: Cloudflare Pages退役 / Worker-only cleanup 実装結果

## Worker-native化

- Pages `functions/` の実装を `worker/handlers/` へ移行。
- Preview helperを `worker/preview.ts` へ移行。
- Worker Env型を `worker/types.ts` に集約。
- `worker/index.ts` はWorker-native handlerのみをimportする。

## Pages固有構成の削除

- `functions/` を削除。
- `public/_redirects` を削除。
- CIのPages Functions buildを削除。
- `dev:proxy` をWorker devへ切替。
- Retirement専用workflowを削除。
- 一時的な `wrangler.custom-domain.jsonc` を削除。

## Custom Domain最終構成

`wrangler.jsonc` をCustom Domain構成へ昇格。

- staging: `staging.hatarakibachi.com`
- production: `hatarakibachi.com`

## Image proxy secret

画像proxyの共有鍵をsource codeから除外し、`IMG_KEY` Worker Secretへ移行。
Deploy workflowはGitHub Environment Secret `IMG_KEY` をWorkerへ同期する。

## UI / docs

- READMEのhosting表記をCloudflare Workers + Static Assetsへ更新。
- footerをCloudflare Workersへ更新。
- Worker-only runbookへ更新。

## Merge前条件

このPRはReady for reviewにできるが、mergeは以下の後に行う。

1. #67 merge
2. Worker RouteでProduction/Staging安定確認
3. #67で追加したRetire Cloudflare Pages workflow実行成功
4. Pages project削除とCustom Domain化成功

その後に#68をmergeする。
