# リリース準備・検証記録

2026-11-14時点。作業基準は `staging` の `8b892ca112afa988965935c1905f579138639dd4` です。`main` の `18308695a2217a5a64172dc3e18b5313f58fa01a` は別checkoutに保持しています。

## 確認できた問題と対応

- 既定ブランチmainのDeployは、stagingに存在するDB接続・Worker・プレビューの改修を含んでいません。失敗実行 [38279829477](https://github.com/salmonmikan/git_hatarakibachi/actions/runs/38279829477) は古い定義でstaging SHAをcheckoutし、Supabase migration listでIPv6接続に失敗しています。
- CIの表示名変更後もDeployのworkflow_runが旧名CIを監視していました。main / stagingともCIから同じSHAのDeployをworkflow_callで呼ぶ構成へ統一しました。
- 手動Deployは対象SHAのlint・テスト・ビルド・DB再構築を実行せずにDBを更新できました。手動実行では外部更新前にこれらを検証します。自動実行は呼び出し元CIの検証を使います。
- productionのSupabase接続もSession poolerのport 5432に統一しました。対象project refとの一致を検証し、不正な接続URLや解析例外に含まれる秘密値は表示しません。
- 外部更新前にDB・Cloudflare・Sanityの必須設定が利用可能か確認します。自動配備が古いSHAを配備しようとした場合は停止します。
- productionの公開後はHTML、JSの配信、団員・ニュースAPIのJSON配列、未認証プレビュー401/no-storeをsmoke testで確認します。SPAのHTMLを返すAPIや認証への302を成功扱いしません。stagingはAccessへログインして手動確認し、自動配備成功と動作確認完了を区別します。
- stagingはCloudflare Accessで保護されています。現在はサービス認証用Secretsを必須にせず、Worker配備後のActions Summaryに手動確認のチェックリストを記録します。Access自体は変更していません。
- Sanity StudioはautoUpdatesを無効にし、ロックファイルで検証したバージョンを配備します。更新は依存更新と検証を通して実施します。

## 初回反映の準備

1. GitHub Environment staging / productionに、対象環境の設定を登録します。秘密値をチャットへ送る必要はありません。productionにはRequired reviewersとmainのDeployment branch制限を設定します。
2. productionへ `SUPABASE_DB_URL` Secretを追加します。Supabase Dashboard → Connect → Session poolerの接続URLを使用し、port 5432とproduction project refを確認します。パスワードの特殊文字はURLエンコードします。既存Secretは削除していません。
3. stagingはサービス認証を追加せず、配備後にご本人がAccessへログインして手動確認します。`CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` の登録は不要です。自動smoke testは実行せず、Actions Summaryのチェックリストを確認してください。Accessの保護は維持します。
4. production PagesはFunctions側の `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SANITY_DATASET=production` / `SANITY_PREVIEW_READ_TOKEN` / `IMG_ORIGIN` / `IMG_KEY` をCloudflare側で設定します。フロントのVITE変数とは別です。現在のproduction Pagesジョブはruntime Secretを同期しません。既存値の取得・比較は実施していません。
5. productionの `PUBLIC_BASE_URL` は `https://hatarakibachi.com`、Pages branchは既存プロジェクトのproduction branchと一致させます。管理画面が別ホストであるため、`https://admin.hatarakibachi.com/login` は公開サイトとは別に確認します。
6. Cloudflare PagesのGit連携による自動production deployが有効なら、Actionsの検証・承認を迂回しないよう、管理者がproductionの配備経路をActionsに統一します。現在のCloudflare管理設定は未確認です。
7. Supabaseのバックアップ／復旧ポイントを管理者が確認します。DB変更後のコードの再配備はDBの巻き戻しにはなりません。

## 反映手順

1. この変更をstaging向けPRとして登録し、CIを通します。未完了の予約機能・Square統合PRや古いWorkers移行ブランチをまとめてマージしません。
2. stagingでdatabase、Worker、CMSの配備成功を確認し、その後AccessへログインしてActions Summaryの手動チェックリストを実施します。ページ表示・直接アクセス・再読み込み・APIのJSON・画像・Studioプレビュー・未認証プレビュー拒否を確認し、時間を置いて再確認します。配備成功だけでは安定稼働確認完了と扱いません。認証済みの管理操作はこの作業では未実施です。
3. production設定とバックアップ確認後、staging→mainのPRをレビュー・マージします。mainのCIが同じSHAのproduction Deployを呼び出します。
4. productionの承認者が対象SHAと変更内容を確認し、GitHub Environmentの保護ジョブを承認します。
5. productionはDB→CMS→Pagesの順に配備し、公開後smoke testを実行します。stagingはWorkers、本番はPagesという既存構成を維持しています。本番Workersへの切替やPages削除は含みません。

手動反映・再実行は、この変更を含むworkflowのブランチを選択し、environmentと対象SHAを指定します。旧mainのworkflowへstaging SHAを渡すだけでは、新しいworkflow定義は使われません。

## 失敗時

- 設定不足・接続先検証失敗: Environment設定を管理者が修正し、同じ対象SHAで再実行します。DB履歴のrepairを実行しません。
- DB変更失敗: ログと適用履歴を確認し、forward-fix migrationまたは承認済みバックアップ復旧を判断します。コードだけのロールバックで解消したと判断しません。
- CMS・Pages・Worker失敗: 一部コンポーネントが更新済みの可能性があります。各ジョブの実行結果と配備SHAを確認し、同じSHAで再実行します。成功済みmigrationは履歴により再適用されません。
- Pagesのコード復旧: Cloudflareの既知の正常なproduction deploymentへ戻し、公開/APIを確認します。DB変更との互換性は別途確認します。
- 自動smoke失敗: 現行の配備内容を自動で巻き戻しません。API、runtime設定、Access、配信アセットを確認します。

## このworkspaceの利用

```bash
source /workspace/hatarakibachi-env.sh
cd /workspace/git_hatarakibachi-staging
npm run check
npm run dev:proxy
# Studioをstagingだけで起動
SANITY_STUDIO_DEPLOY_ENV=staging npm run dev --prefix sanity-studio
```

Node 22.17.0 / npm 10.9.2と両package-lock.jsonから依存を導入しました。ユーザー設定ディレクトリがread-onlyなので、npm cache / Wrangler logsはworkspace内へ置いています。Supabaseのローカル検証は、ロックされたnpm packageに同梱されたGo CLIをworkspace専用環境変数で選択しています。リポジトリの依存バージョンは更新していません。

公開URLへの読取確認では本番の `/` / `/api/web-members` / `/api/web-sitenews?limit=1` が200、`/api/draft` が401でした。stagingは各パスがAccessへ302で転送されることを確認しました。これは今回変更したworkflowによる配備確認ではありません。

検証の最終結果と未検証項目は `.local/agent_docs/20261114_environment_release_result.md` に記録します。
