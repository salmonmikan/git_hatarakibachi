# Cloudflare重複デプロイジョブ削除結果

## 実施結果

- Deploy workflow内の `frontend` ジョブを削除した。
- Cloudflare PagesのGit連携デプロイを唯一のフロントエンドデプロイ経路とした。
- Supabase migrationおよびSanity Studioデプロイのジョブは変更していない。

## 検証

- PR CIの結果を確認する。
- Cloudflare Pagesの外部チェック結果を確認する。

## 未変更

- Cloudflare PagesのGit連携設定および認証情報は参照・変更していない。
