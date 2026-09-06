# チケット予約DB・セキュリティ実装結果

## migration整理

- 予約機能のmigration群は `main` に未マージで、本番Supabaseのmigration履歴にも未適用であることを確認した。
- STG SupabaseはINACTIVEのためmigration履歴取得がタイムアウトした。STGへのrestore/reset/applyは行っていない。
- レビュー修正で増えていた予約系migrationを `20260614000000_add_ticket_reservation_system.sql` の1本へsquashした。
- 新規テーブル作成時点から最終constraint、RLS、権限、RPC、必要なtriggerを定義し、後続migrationによる再定義を廃止した。

## DB設計

- 公開予約のwrite boundaryを `public.create_ticket_reservation` RPCへ限定した。
- 匿名・authenticatedクライアントから `ticket_reservations` への直接INSERT / UPDATE / DELETEを許可しない。
- 公開予約RPCは公開状態、Sanity連携、受付期間、枠履歴、枠所属、開始時刻、数量、残数、request ID冪等性を検証する。
- 予約RPCはevent行を先にロックし、必要な場合のみwindow行を続けてロックする。window待機後は `clock_timestamp()` で終了時刻と枠開始時刻を再評価する。
- 自由席予約後の枠追加は、window追加時にevent行をロックするtriggerで予約RPCと直列化する。
- 枠定員の縮小、予約済み枠のevent変更は専用triggerで保護する。
- 行単体の文字数、slug、タイトル、日時順、Sanity連携などは新規テーブルのconstraintとして最初から定義する。
- 予約番号は10文字仕様を維持し、transaction advisory lockを使って衝突候補を再生成する。
- 既存API互換のため、note有無・request ID有無の公開RPC overloadは維持する。

## レビュー基準

- `AGENTS.md` にDB migrationのsquash条件とレビュー対象を追記した。
- 未リリース・未適用migrationの試行錯誤prefixを独立した本番状態としてP1/P2評価しない。
- 既に適用済みのmigration、rolling deploy、非transactional操作など実運用で観測可能な中間状態は引き続きレビュー対象とする。

## 検証

- 本番Supabaseのmigration履歴は2026-04-24までで、予約系migrationが未適用であることを確認した。
- STG Supabaseには変更を加えていない。
- GitHub Actions CIと再レビューをsquash後の最新headで確認する。
- このセッションではローカルSupabase / PostgreSQL実行環境がないため、fresh migrationとpgTAPの実行確認は未実施。
