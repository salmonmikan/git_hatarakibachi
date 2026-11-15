# 劇団はたらきばち公式サイト

劇団はたらきばちの公式サイトを構成するリポジトリです。

## アーキテクチャ構成

- **フロントエンド**: React + Vite
- **デプロイ・ホスティング**: Cloudflare Pages
- **CMS (コンテンツ管理)**: Sanity Studio (v3)
- **データベース / 認証**: Supabase
- **スタイリング**: Vanilla CSS

## ディレクトリ構成

- `/src`: フロントエンド（React）のソースコード
- `/sanity-studio`: Sanity Studio の設定・定義一式
- `/functions`: Cloudflare Pages Functions (サーバーサイドロジック)
- `/supabase`: Supabase の設定・マイグレーション関連

## ローカル開発

Node.jsは `.nvmrc` の22.17.0、npmは10.9.2を使用します。

```bash
nvm install
nvm use
npm install --global npm@10.9.2
npm ci
npm ci --prefix sanity-studio
npm run check
```

SupabaseのURLと公開用キーは、Viteビルド時の `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`、Functions実行時の `SUPABASE_URL` / `SUPABASE_ANON_KEY` に設定します。ローカルでもstagingまたはローカルDBを指定してください。秘密値はチャットやGitへ記録せず、手元の環境設定から渡します。

このCloud workspaceでは `source /workspace/hatarakibachi-env.sh` で検証済みツールチェーンを選択できます。環境設定と本番反映手順は [CI/CD運用](docs/ci-cd.md) と [リリース準備・検証記録](docs/release-readiness.md) を参照してください。

### 1. フロントエンドの起動

以下のコマンドを実行することで、Cloudflare Pages の開発サーバ（Functions）と Vite の開発サーバ（HMR）が同時に起動し、リバースプロキシ経由で開発環境にアクセスできます。

```bash
npm run dev:proxy
```

### 2. Sanity Studio の起動

CMS の管理画面をローカルで起動します。

```bash
cd sanity-studio
npm run dev
```

- ブラウザで `http://localhost:3333` にアクセスしてください。
- **注意**: ローカル実行時は `staging` ワークスペースが先頭に表示されます。本番ワークスペースも選択できるため、stagingだけに限定する場合は `SANITY_STUDIO_DEPLOY_ENV=staging npm run dev` を使用してください。

### 3. Sanity Studio のデプロイ

スキーマ変更や設定変更の本番反映は、対象環境を指定したGitHub ActionsのDeployから行います。CIと同じSHAを使い、DB・CMS・フロントの順で反映します。以下は管理者が単独反映する必要がある場合のコマンドです。

```bash
cd sanity-studio
SANITY_STUDIO_DEPLOY_ENV=production npm run deploy
```

デプロイ完了後、`https://hatarakibachi.sanity.studio/` にて、本番の CMS が更新されていることを確認できます。

## 主要なコマンド

- `npm run dev:proxy`: フロントエンド開発サーバ + Cloudflare Proxy の起動（推奨）
- `npm run build`: プロダクションビルドの作成（Cloudflare Pages 用）
- `npm run lint`: ESLint による静的解析（`src/` 配下）
- `npm run sb:*`: Supabase 関連の操作（詳細は `package.json` 参照）
- `npx sanity deploy`: Sanity Studio のデプロイ（`sanity-studio/` 配下で実行）

## ロゴ生成について

`src/assets/gen-logo.mjs` を通じてロゴ画像が自動生成されます。`npm run dev` や `npm run build` の実行前に自動的に動作するよう設定されています。
