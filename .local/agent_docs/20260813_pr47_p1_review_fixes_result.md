# PR #47 P1レビュー指摘修正結果

## 実装内容

- Cloudflare Pages deploy stepから未閉鎖のproduction/staging shell分岐を除去し、Environment別のPages branchを使う1つのdeployコマンドへ統一した。
- Sanity Studioのdeployment app IDを`SANITY_STUDIO_APP_ID`から取得するよう変更した。
- Deploy Studio stepでGitHub Environment variableを渡し、未設定時はdeploy前に失敗するようにした。
- CI/CD運用文書に、stagingとproductionで別々の`SANITY_STUDIO_APP_ID`を設定する要件を記載した。

## 検証

- `npm run lint`: 成功。
- rootの`npm run build`: 成功。
- `sanity-studio`の`tsc --noEmit`: 成功。
- `deploy.yml`のYAML parse: 成功。
- Cloudflare Pages deploy scriptのBash構文: 成功。
- `sanity-studio`の`npm run build`: Sanity auto-update用CDNへの接続がsandboxで拒否され未完。ローカルでEnvironment variableを渡さないため、`SANITY_STUDIO_APP_ID`未設定の警告も出る。
- 外部deployおよびGitHub Environment valuesの確認: 未実施。
