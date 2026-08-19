# Cloudflare重複デプロイジョブ削除計画

## 目的

Cloudflare PagesのGit連携デプロイと重複しているDeploy workflow内のCloudflare CLIデプロイジョブを削除する。

## 変更範囲

- `.github/workflows/deploy.yml` の `frontend` ジョブを削除する。
- Supabase migration、Sanity Studioデプロイ、Cloudflare Git連携による自動デプロイは変更しない。

## 検証

- PR CIが成功することを確認する。
- mainへの既存コミットでCloudflare Pagesチェックが成功していることを確認する。
