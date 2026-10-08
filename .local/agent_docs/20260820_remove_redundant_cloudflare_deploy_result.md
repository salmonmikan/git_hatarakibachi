# Cloudflare重複デプロイ削除とmigration CI短縮結果

## 実施結果

- Deploy workflow内の `frontend` ジョブを削除した。
- Cloudflare PagesのGit連携デプロイを唯一のフロントエンドデプロイ経路とした。
- PRでは`supabase/`またはルートの依存定義に変更がない場合、ローカルSupabaseを起動するmigration完全検証をスキップする条件を追加した。
- `main` / `staging` へのpushではmigration完全検証を常に実行する。
- Supabase migrationおよびSanity Studioデプロイのジョブは変更していない。

## 検証

- PR CIの結果を確認する。
- Cloudflare Pagesの外部チェック結果を確認する。

## 未変更

- Cloudflare PagesのGit連携設定および認証情報は参照・変更していない。
