# Cloudflare重複デプロイ削除とmigration CI短縮計画

## 目的

- Cloudflare PagesのGit連携デプロイと重複しているDeploy workflow内のCloudflare CLIデプロイジョブを削除する。
- migrationに無関係なPRでは、ローカルSupabase起動・全migration再適用をスキップしてCI時間を短縮する。

## 変更範囲

- `.github/workflows/deploy.yml` の `frontend` ジョブを削除する。
- `.github/workflows/ci.yml` に変更検出ジョブを追加する。
- PRでは、`supabase/` またはルートの依存定義に変更がある場合だけmigration完全検証を実行する。
- `main` / `staging` へのpushでは従来どおり毎回migration完全検証を実行する。

## 検証

- PR CIが成功することを確認する。
- migrationに無関係なPRで、migration検証ジョブがスキップされることを確認する。
- mainの既存コミットでCloudflare Pagesチェックが成功していることを確認する。
