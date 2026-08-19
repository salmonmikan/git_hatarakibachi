# main CI and deploy foundation plan

## 目的

GitHub Actionsのデフォルトブランチである `main` にCIとDeploy workflowを配置し、`main` と `staging` のpush後にCI成功を条件としてそれぞれproductionとstagingへ自動デプロイできるようにする。

## 実施計画

1. `staging` で使用中の `.github/workflows/ci.yml` を `main` 向けPRへ追加する。
2. `staging` で使用中の `.github/workflows/deploy.yml` を `main` 向けPRへ追加する。
3. PR上でCIが成功し、PR起点ではDeployが実行されないことを確認する。
4. `main` へのマージ後は、main/stagingのpush CI成功を起点にDeployが実行される構成とする。

## 範囲外

- GitHub EnvironmentのSecrets、Variables、認証情報の参照または変更
- 手動デプロイの実行
- 本PRのマージ
- アプリケーションコード、Supabase migration、Sanityスキーマの変更
