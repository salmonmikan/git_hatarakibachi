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

## 2. Cloudflare Pages環境変数

値そのものはリポジトリへ保存せず、Cloudflare Pagesの環境変数 / Secretへ登録します。

| 変数 | 種別 | 内容 |
| --- | --- | --- |
| `SUPABASE_URL` | 既存 | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Webhook・登録APIから課金テーブルを更新するためのService Role Key |
| `SQUARE_ACCESS_TOKEN` | Secret | Square API Access Token |
| `SQUARE_LOCATION_ID` | 変数 | Square Location ID |
| `SQUARE_MEMBER_FEE_PLAN_VARIATION_ID` | 変数 | 月額1,000円プランのVariation ID |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Secret | Webhook endpointのSignature Key |
| `SQUARE_WEBHOOK_NOTIFICATION_URL` | 変数 | Square Developer Consoleへ登録したWebhook URLと完全一致するURL |
| `SQUARE_ENVIRONMENT` | 変数 | `sandbox` または `production` |
| `SQUARE_API_VERSION` | 任意 | 未設定時は `2026-08-19` |
| `VITE_PUBLIC_SITE_URL` | 任意 | 管理画面から作る団員登録URLの公開サイトOrigin |

`VITE_PUBLIC_SITE_URL` が未設定の場合、管理画面ホストの `admin.` または `admin-` 接頭辞を外したOriginを使用します。実際のドメイン構成がこの規則に合わない場合だけ設定してください。

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

Developer Consoleに表示されるSignature Keyを `SQUARE_WEBHOOK_SIGNATURE_KEY` に設定し、Developer Consoleへ登録したNotification URLを文字列どおり `SQUARE_WEBHOOK_NOTIFICATION_URL` に設定します。

Webhook payloadは配送順を保証しない前提で処理します。Subscription / Invoiceイベント受信時はSquare APIから現在のリソースを再取得し、その状態を正としてSupabaseへ同期します。処理中の同一イベント再送には2xxを返さず、Square側の再送を継続させます。

## 4. DB Migration

このPhaseでは以下を追加します。

- `member_billing`: 団員とSquare Customer / Subscriptionの対応
- `member_fee_payments`: 月別の団員費入金台帳
- `square_webhook_events`: Webhookの重複処理防止・連携エラー監視

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
