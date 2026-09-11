# Square 団員費連携 Phase 1 実施結果

## 実施内容

- `member_billing` / `member_fee_payments` / `square_webhook_events` を追加した。
- 既存団員を `member_billing` へバックフィルし、新規団員追加時はTriggerで自動作成するようにした。
- 団員専用の登録URLからSquare Checkout APIで月額1,000円のSubscription Checkoutを作成するPages Functionを追加した。
- Square WebhookのHMAC-SHA256署名検証を追加した。
- `subscription.created` / `subscription.updated` からCustomer・Subscriptionを団員へ紐付ける処理を追加した。
- `invoice.payment_made` / `invoice.scheduled_charge_failed` / `invoice.refunded` から月別入金台帳を更新する処理を追加した。
- Webhook event IDによる重複排除に加え、一時エラー後のSquare再送を再処理できるclaim処理をDB Functionとして追加した。
- Subscription系Webhookではpayloadの到着順に依存せず、Square APIから現在のSubscriptionを再取得してStatusを同期するようにした。
- Invoice系Webhookでも現在のInvoice / Subscriptionを毎回再取得し、古い部分入金イベントが完済状態を巻き戻さないようにした。
- 団員費Plan Variation IDを検証し、別用途のSquare Subscriptionを誤って台帳へ取り込まないようにした。
- Subscriptionが別Planへ変更された場合は団員費の紐付けを解除し、別用途の請求を団員費へ誤計上しないようにした。
- 全額・一部返金ではOrder / Paymentを取得し、`Payment.refunded_money` から返金後の純入金額を月別台帳へ反映するようにした。
- Checkoutごとに `registration_attempt_token` を生成し、Square Checkoutの `payment_note` へ埋め込むことで、決済画面上でメールアドレスが変更されても初回Paymentから団員を一意に紐付けられるようにした。
- `PENDING` 中は新しいPayment Linkを発行せず、既存リンクを返すようにして二重Subscription作成を防止した。
- 同一Webhookが処理中に再送された場合は2xxを返さず、Squareの再送を継続させるようにした。
- `CANCELED` / `COMPLETED` は登録リンクから再登録可能とし、`DEACTIVATED` は既存Subscriptionの再開対象として新規登録を禁止した。
- 公開サイトへ団員専用登録画面・完了画面を追加した。グローバルナビには追加していない。
- Adminへ団員費管理画面を追加し、契約状態、今月の入金、決済失敗、返金、登録待ち、Webhook要確認イベントを表示するようにした。
- `Manage Members` から団員費管理へ移動でき、未登録団員の専用登録URLをコピーできるようにした。
- `docs/member-fee-square-setup.md` に外部設定手順を追加した。

## レビュー対応

PR #57 のCodexレビューを都度再評価した。

### 初回レビュー

- Webhook一時失敗後の再処理: 妥当。再claim可能な実装へ修正した。
- Payment Link再利用による二重Subscription: Checkout API生成Payment Linkは決済成功後に再利用できないため、本実装では非該当と判断した。
- 古いSubscriptionイベントによる状態巻き戻し: 妥当。Square上の現在Subscriptionを都度取得する方式へ修正した。
- Plan変更後Invoiceの誤計上: 妥当。Invoice処理でも現在Planを都度検証し、別Planなら紐付け解除・計上対象外とした。

### 再レビュー

- PENDING中の別メールによるPayment Link多重発行: 妥当。既存Payment Linkを再利用する方式へ修正した。
- 古い部分入金イベントによるPAIDの巻き戻し: 妥当。現在Invoiceを再取得して台帳状態を決める方式へ修正した。
- Checkoutで変更可能なメールだけに契約を紐付けている: 妥当。`payment_note` の不変なattempt tokenをPaymentから逆引きする方式へ修正した。
- 終了済みSubscriptionの再登録不可: 一部妥当。`CANCELED` / `COMPLETED` は再登録可能とし、`DEACTIVATED` はSquareの既存Subscription再開対象として新規登録を禁止した。
- stale期限前のWebhook再送を200で止める: 妥当。処理中イベントは `busy` として503を返すよう修正した。
- 返金が月別台帳へ反映されない: 妥当。`invoice.refunded` を処理し、Paymentの返金額を台帳へ反映するよう修正した。

## 検証結果

初回実装および初回レビュー対応後のPR CIは成功済み。

- ESLint: success
- Vite build: success
- Cloudflare Pages Functions build: success
- Sanity Studio build: success
- Migration filename validation: success
- Local Supabase起動: success
- 全Migration再適用: success
- Local Supabase停止: success

再レビュー対応後の最終HEADについても同じPR CIを再実行して確認する。

## 未実施 / マージ後に必要な確認

外部サービスのSecretや本番環境へは変更を加えていないため、以下は未実施。

- Cloudflare PagesへのSquare / Supabase Service Role環境変数設定
- Square Developer ConsoleへのWebhook登録（`invoice.refunded` を含む）
- Square Sandboxを使った実カード相当のSubscription Checkout E2E確認
- Checkout上でメールアドレスを変更した場合のattempt token紐付け確認
- 全額 / 一部返金WebhookのSandbox E2E確認
- Staging / Production SupabaseへのMigration適用
- Productionでの実決済確認

必要な外部設定値・手順は `docs/member-fee-square-setup.md` を参照する。

## Phase 1対象外

- Pause / Resume / Cancel API連動
- 自サイト内カード入力
- 休団・復団・退団操作とSquareの自動連動
