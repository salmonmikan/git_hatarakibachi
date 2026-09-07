# main CI and deploy foundation result

## 実施結果

- `main` には `.github/workflows/` 配下のworkflowが存在しないことをGitHub APIで確認した。
- `staging` の `ci.yml` と `deploy.yml` を、main起点の限定ブランチへ同一内容で追加した。
- Deploy workflowは `main` / `staging` のpush CI成功後に、それぞれproduction / staging Environmentを選ぶ構成である。
- PR起点のCIはDeployジョブの条件から除外されるため、PR作成時にはデプロイを実行しない。

## 検証

- GitHub ActionsのPR CI結果を確認する。
- PR差分がworkflow2ファイルと本作業記録2ファイルだけであることを確認する。

## 未確認・未変更

- GitHub EnvironmentのSecrets、Variables、認証情報の値および登録状態は参照していない。
- 本PRのマージおよびproduction/stagingへの実デプロイは実行していない。
