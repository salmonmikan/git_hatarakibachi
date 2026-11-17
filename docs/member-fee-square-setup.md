# Square 団員費連携 Phase 1 セットアップ

## 対象

劇団はたらきばちの月額団員費（1,000円）を、Squareのサブスクリプションと既存Webシステムへ接続するための設定手順です。

この実装ではカード情報を劇団サイトで保持しません。団員専用URLからSquareホスト型チェックアウトへ遷移し、Square Webhookで契約状態と月別入金台帳をSupabaseへ同期します。

## 1. Square側の準備

Squareで月額1,000円・JPYのサブスクリプションプランバリエーションを作成します。Checkout APIのSubscription Plan Checkoutで使用できる、継続する有料フェーズ1つの構成にしてください。

取得しておく値:

- Location ID
- Subscription Plan Variation ID
- Access Token

本番運用前はSquare Sandboxで同じ構成を作り、StagingへSandboxの値を設定します。

## 2. Staging Workerの設定

現在のstagingはWorkers + Static Assetsで配信します。値はチャットやリポジトリへ貼り付けず、利用者がGitHub Environment `staging` のSecretsへ登録してください。既存のDeploy workflowがWorkerへ渡します。設定前でもコード配備は可能ですが、登録・課金同期の実動確認は未完了です。

| 変数 | 種別 | 内容 |
| --- | --- | --- |
| `SUPABASE_URL` | 自動 | 既存の `SUPABASE_PROJECT_REF` から生成 |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Webhook・登録APIから課金テーブルを更新するためのService Role Key |
| `SQUARE_ACCESS_TOKEN` | Secret | Square API Access Token |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Secret | Webhook endpointのSignature Key |
| `SQUARE_ENVIRONMENT` | 固定 | `wrangler.jsonc` のstaging設定で `sandbox` を指定 |
| `SQUARE_API_VERSION` | コード既定 | `2026-08-19` |

団員費機能のEnvironment Secretsは `SUPABASE_SERVICE_ROLE_KEY`、`SQUARE_ACCESS_TOKEN`、`SQUARE_WEBHOOK_SIGNATURE_KEY` の3つです。Location IDとPlan Variation IDはSecret・Variable・リポジトリ定数ではなく、以下のDB行で管理します。既存のID用Secretsはコード配備後には使用されません。この作業ではそれらを削除しません。

`VITE_PUBLIC_SITE_URL` が未設定の場合、管理画面ホストの `admin.` または `admin-` 接頭辞を外したOriginを使用します。実際のドメイン構成がこの規則に合わない場合だけ設定してください。現workflowはこの値をビルドへ注入していないため、GitHub変数の追加だけでは反映されず、必要時はworkflowの変更も必要です。

## 3. Webhook設定

Notification URL:

```text
https://<公開サイト>/api/square/webhook
```

購読イベント:

- `subscription.created`
- `subscription.updated`
- `invoice.payment_made`
- `invoice.scheduled_charge_failed`
- `invoice.refunded`

Developer Consoleに表示されるSignature KeyをGitHub Environment `staging` の `SQUARE_WEBHOOK_SIGNATURE_KEY` に設定します。署名検証のcanonical URLは通常、受信したrequest URLから導出するため、stagingでは `https://staging.hatarakibachi.com/api/square/webhook` を登録します。`SQUARE_WEBHOOK_NOTIFICATION_URL` は通常追加不要ですが、既存Workerに手動上書きがある場合はrequest URLより優先されるため、利用者がNotification URLと一致させてください。

Cloudflare Accessでstagingを保護している場合は、Squareから届く `/api/square/webhook` がログイン画面へ転送されないよう、このパスに限定した例外を利用者が設定してください。Webhook自体は署名検証で保護します。Access設定の変更と実Webhook送信は今回のコード配備には含めません。

Webhook payloadは配送順を保証しない前提で処理します。Subscription / Invoiceイベント受信時はSquare APIから現在のリソースを再取得し、その状態を正としてSupabaseへ同期します。処理中の同一イベント再送には2xxを返さず、Square側の再送を継続させます。

## 4. DB Migration

このPhaseでは以下を追加します。

- `member_billing`: 団員とSquare Customer / Subscriptionの対応
- `member_fee_payments`: 月別の団員費入金台帳
- `square_webhook_events`: Webhookの重複処理防止・連携エラー監視
- `member_fee_settings`: Square環境・Location ID・Plan Variation IDを保持する `id = 1` の単一設定行

`member_fee_settings` はRLSと明示的な権限で保護し、`service_role` はSELECTのみ、`anon` / `authenticated` はアクセス不可とします。Migrationでは設定行を投入しません。利用者が信頼できるSQL管理経路で、対象環境のDBへ設定してください。

以下は**利用者が手元でプレースホルダーを置き換えるSQLテンプレート**です。実IDをチャットやリポジトリへ記載しないでください。3項目とも空白だけの値は使用できません。

```sql
INSERT INTO public.member_fee_settings
  (id, square_environment, square_location_id, square_plan_variation_id)
VALUES
  (1, 'sandbox', '<REPLACE_WITH_LOCATION_ID>', '<REPLACE_WITH_PLAN_VARIATION_ID>')
ON CONFLICT (id) DO UPDATE SET
  square_environment = EXCLUDED.square_environment,
  square_location_id = EXCLUDED.square_location_id,
  square_plan_variation_id = EXCLUDED.square_plan_variation_id;
```

このSQLは意図した初期設定・設定変更時にのみ実行します。productionとstagingは別DBで管理し、`square_environment` は `sandbox` または `production` を指定してWorkerの `SQUARE_ENVIRONMENT` と一致させます。stagingは `sandbox` です。DBコピー時はコピー元の環境・IDが残る点に注意してください。設定行の欠落や環境不一致時はAPIが503を返し、旧ID環境変数へのフォールバックは行いません。

WebhookもこのPlan Variation IDで課金プランを選別するため、変更は既存契約の同期への影響を確認して慎重に行ってください。この機能のMigrationとコード配備後はDBのID変更だけなら再配備不要です。Secretsの変更には既存の配備手順による再配備が必要です。

`member_billing.registration_attempt_token` は、各Checkout発行時に生成する変更不能な内部識別子です。Checkout APIの `payment_note` にこの値を埋め込み、Square Checkout上で購入者がメールアドレスを変更しても、初回Paymentから正しい団員へ紐付けられるようにします。メールアドレスは連絡・表示用であり、契約紐付けの主キーには使用しません。

既存団員にはMigration時に `member_billing` を自動作成し、新規団員にはDB Triggerで自動作成します。

## 5. 運用開始

1. Adminの `Manage Members` から「団員費管理」を開く。
2. 未登録団員の「登録リンクをコピー」を押す。
3. 本人へURLを共有する。
4. 本人がメールアドレスを入力してSquareへ遷移し、定期決済を登録する。
5. 登録途中で同じURLを再度開いた場合は、新しいCheckoutを発行せず既存のSquare決済ページを再利用する。
6. Square Webhook受信後、Adminの団員費管理へ契約状態・月別入金状況が反映される。
7. Squareで全額・一部返金を行った場合も `invoice.refunded` を受けて台帳へ反映する。

## 契約終了後の扱い

- `CANCELED` / `COMPLETED`: 登録リンクから新しいSubscriptionを作成できます。
- `DEACTIVATED`: Square側で既存Subscriptionを再開できる状態として扱い、このPhaseでは新規Subscriptionを作りません。管理画面では「要再開」と表示します。
- Pause / Resume / CancelのWeb管理画面からの自動操作はPhase 1対象外です。

## Phase 1で行わないこと

- 休団時のSquare Pause API連動
- 復団時のResume API連動
- 退団時のCancel API連動
- カード入力フォームの自サイト内埋め込み
- 本番環境へのMigration適用やCloudflare/Square設定変更

## Stagingへの反映と未確認範囲

- stagingへのpush後、CIでmigrationとpgTAPを検証し、同じSHAのDB migrationとWorker配備を既存workflowで実行します。
- 取り込み元はPR #60の `8fab94984382de89e769d6a72c52a47d6a42ff7c` です。既存の課金処理をWorkerルートへ接続し、PR全体の履歴や運用ルール変更は取り込みません。
- Environment Secretsを投入・変更した後は、同じ設定を参照するstaging配備を再実行してください。DBのIDだけの変更には再配備は不要です。
- 今回は実際の設定値や決済を参照・検証していません。
- 実Checkout、Webhook到達、入金・返金同期、Access認証後の管理画面は利用者による確認が必要です。コード配備成功と区別してください。
