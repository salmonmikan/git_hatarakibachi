# Issue #33 実装結果

## 追加内容
- Supabase migration にチケット販売ページ、予約枠、予約テーブルと RLS を追加。
- Web 公開予約ページ `/tickets/:slug` を追加。
- 管理画面に `Manage Tickets` を追加し、販売ページ作成/編集、予約枠追加、予約一覧、キャンセルを実装。
- Dashboard に Ticket Manager への導線を追加。

## 注意事項
- 事前決済、座席指定、在庫の同時更新制御は今回の最小構成の対象外。
- 予約完了メール送信は未実装。必要な場合は別途 Edge Functions 等で追加する。

## PR #39 追加改修結果
- Sanity `performance` の `_id` を `ticket_events.sanity_performance_id` として連携。管理画面で公演を選択し、Sanity側のタイトル・公演日時・会場、公開ページ、既存Studio workspaceへのリンクを表示する。
- 既存の未連携データはnullを許容しつつ、販売ページを公開する場合はUIとDBの両方でSanity連携を要求する。連携先が取得できない場合もIDと警告を表示する。
- 予約枠のラベル・日時・定員を編集可能にし、残数（定員−active予約数）を表示。削除は物理DELETE権限を剥奪し、admin認証済みのソフト削除RPCで `deleted_at` を設定する。
- 既存予約数を下回る定員変更をDB triggerで拒否し、削除後も予約履歴を保持する。受付開始/終了日時の逆転もUIとDBで拒否する。
- 公開予約成功後にavailabilityを再取得し、同一ページの残数表示を更新する。
- DB/pgTAP 58件、対象JS ESLint、Nodeテスト4件、buildを実行。全体lintは既存のESLint違反が残るため失敗するが、今回変更ファイルの対象lintは成功。
