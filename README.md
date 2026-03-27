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
- **注意**: ローカル実行時は自動的に `staging` データセットに向くように設定されています。本番データに影響を与えずにコンテンツの編集や検証が可能です。

## 主要なコマンド

- `npm run dev:proxy`: フロントエンド開発サーバ + Cloudflare Proxy の起動（推奨）
- `npm run dev`: フロントエンド開発サーバのみ起動（Vite HMR）
- `npm run build`: プロダクションビルドの作成
- `npm run lint`: ESLint による静的解析
- `npm run sb:*`: Supabase 関連の操作（詳細は `package.json` 参照）

## ロゴ生成について

`src/assets/gen-logo.mjs` を通じてロゴ画像が自動生成されます。`npm run dev` や `npm run build` の実行前に自動的に動作するよう設定されています。
