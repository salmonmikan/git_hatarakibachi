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

## PR #39 レビュー指摘7件への追加対応結果
- 管理者権限RLS: `20260805152700_secure_ticket_reservations.sql` の `admin_users.uuid = auth.uid()` ポリシーと、既存pgTAPの非管理者拒否テストを現行実装として維持。今回の追加RPCも同じ管理者判定を使用する。
- 公開予約対象イベントのDB検証: 既存の `private.create_ticket_reservation` の公開状態・削除状態・受付期間・枠とイベントの一致検証を維持し、追加の `ticket_reservations_acceptance_guard` でもDB挿入経路を防御する。
- 日時順序制約: `ticket_events_time_order_check` と管理画面の入力検証を現行実装として維持し、pgTAPで逆転日時を拒否することを確認。
- 予約成功後の残席更新: `TicketReservation.jsx` の予約成功後再取得を現行実装として維持。成功後に公開RPCから最新残数を再取得する。
- 全枠削除後の自由席化: `20260807160000_ticket_reservation_review_hardening.sql` で、過去を含めて予約枠が存在するイベントの `window_id = null` をRPC本体とDBトリガーの両方で拒否。ソフト削除された予約枠と予約履歴は保持する。
- 予約集計上限: 管理画面の全予約行REST取得を廃止し、admin限定 `get_ticket_window_reservation_totals()` で `window_id` ごとの `sum(quantity)` をDB側で集計する。REST `max_rows = 1000` による残数誤りを避ける。
- 予約枚数上限: `getTicketReservationMaxQuantity()` で有限枠の残数と10枚上限の小さい方を計算し、公開フォームの `max`、入力妥当性、送信ボタンへ反映。Nodeテストを追加。
- 追加検証: pgTAP 63件PASS、Nodeテスト6件PASS、対象JS ESLint PASS、build PASS（既存のchunk size warningのみ）、git diff --check PASS。全体lintは既存ファイル由来の31 errors/4 warningsで失敗し、変更対象ファイルにはエラーなし。
