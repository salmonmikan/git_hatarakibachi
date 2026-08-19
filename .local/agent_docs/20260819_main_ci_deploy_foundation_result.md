# main CI and deploy foundation result

## 実施結果

- `main` には `.github/workflows/` 配下のworkflowが存在しないことをGitHub APIで確認した。
- `staging` の `ci.yml` と `deploy.yml` を、main起点の限定ブランチへ同一内容で追加した。
- `.nvmrc` を追加し、CIのNode.jsバージョンをstagingと同じ `22.17.0` に固定した。
- stagingで通過済みのlint修正、Vite設定、およびSupabase Storageの廃止済みトリガー削除を反映した。
- `sanity-studio/package-lock.json` を同期し、Studioの `npm ci` における依存関係不整合を解消した。
- Deploy workflowは `main` / `staging` のpush CI成功後に、それぞれproduction / staging Environmentを選ぶ構成である。
- PR起点のCIはDeployジョブの条件から除外されるため、PR作成時にはデプロイを実行しない。

## 検証

- PR #55の最終コミット `487e29f` に対して、以下の全チェック成功を確認した。
  - Lint and build
  - Validate database migrations
  - Analyze (javascript-typescript)
  - CodeQL
  - Cloudflare Pages
- GitHub EnvironmentのSecrets、Variables、認証情報の値および登録状態は参照していない。

## 未確認・未変更

- 本PRのマージおよびproduction/stagingへの実デプロイは実行していない。
