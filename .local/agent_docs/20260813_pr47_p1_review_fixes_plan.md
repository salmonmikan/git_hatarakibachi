# PR #47 P1レビュー指摘修正計画

## 対象

- `.github/workflows/deploy.yml` のCloudflare Pages deploy stepにある未閉鎖のshell分岐を修正する。
- stagingとproductionでSanity Studioのdeploy先を分離する。
- `.local/agent_docs` に計画と実装結果を保存する。

## 実装方針

- Cloudflare deployはEnvironmentごとに設定済みのPages branchを常に指定するため、実質的に同一だった分岐を1つのdeployコマンドへ整理する。
- `sanity.cli.ts` は `SANITY_STUDIO_APP_ID` を参照する。
- workflowのDeploy Studio stepはGitHub Environment variableを渡し、未設定なら外部deploy前に失敗させる。
- CI/CD運用文書にEnvironment別の`SANITY_STUDIO_APP_ID`を追加する。

## 確認方針

- YAMLをparseしてshell分岐の不整合がないことを確認する。
- root lint/buildとSanity Studio buildを実行する。
- 外部deployおよびGitHub Environment valuesの確認は実施しない。
