# Issue #64 64-4: Cloudflare Pages退役 / Worker-only cleanup 計画

## 前提

- #67をmainへmerge済み。
- Production/Staging Worker Routeで安定運用済み。
- #67で追加した `Retire Cloudflare Pages` workflowを実行し、Pages project削除とWorker Custom Domain化が成功済み。
- その後にこのPRをmergeする。

## 目的

Cloudflare Pages固有のコード・CI・routing設定を削除し、Worker + Static Assetsだけで運用する最終構成へ整理する。

## 変更

- Pages `functions/` 依存を廃止。
- Worker-native handlerへ移行。
- `worker/index.ts` からWorker handlerを直接利用。
- Pages Functions buildをCIから削除。
- `public/_redirects` を削除し、Workers Static Assets SPA fallbackへ一本化。
- `wrangler.custom-domain.jsonc` の内容を通常 `wrangler.jsonc` へ昇格。
- Retirement専用workflowを削除。
- Pages用ローカルdev scriptをWorker devへ切替。
- image proxyの共有鍵をsourceから除外し、`IMG_KEY` Worker Secretへ移行。
- runbookをWorker-only運用へ更新。

## GitHub Environment追加Secret

- `IMG_KEY`

staging / productionそれぞれへ設定し、GitHub Environment → Wrangler `--secrets-file` でWorkerへ同期する。

## Acceptance Criteria

- `functions/` が存在しなくてもWorker buildが成功。
- CIにPages Functions buildが存在しない。
- Worker default/staging/production dry-runが成功。
- Production/StagingはCustom Domain設定。
- Pages retirement workflowが不要になる。
- Worker runtime secretがsource codeに残らない。
- ドキュメントがWorker-only構成に更新されている。
