# staging environment foundation result

## 実施結果

- Supabase staging プロジェクト `hatarakibachi-staging` を `yuki` 組織、`ap-northeast-1` に作成し、`ACTIVE_HEALTHY` を確認した。
- `develop` の先頭コミットから `staging` ブランチを作成した。
- 新PR用ブランチ `codex/staging-environment-foundation` を作成した。
- `.github/workflows/ci.yml`、`.github/workflows/deploy.yml`、`docs/ci-cd.md` の `develop` を `staging` に置き換えた。
- staging GitHub Environment の設定値は参照・登録せず、必要な設定項目だけを整理した。

## 検証

- `staging...codex/staging-environment-foundation` の差分を確認し、3ファイル・15行変更のみであることを確認した。
- CI の実行結果はPR作成後のGitHub Actionsで確認する。

## 手動設定が必要な項目

staging GitHub Environmentへ、Supabase project ref、URL、公開用キー、およびDB接続用Secretsを登録する必要がある。値・登録状態は確認していない。
