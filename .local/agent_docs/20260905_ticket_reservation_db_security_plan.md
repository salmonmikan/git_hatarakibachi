# チケット予約DB・セキュリティ実装計画

## 対象

- `ticket_events`、`ticket_windows`、`ticket_reservations` のスキーマを追加する。
- 公開予約は `SECURITY DEFINER` RPC に限定し、公開状態・Sanity連携・受付期間・枠所属・開始時刻・数量・残数をDB内で検証する。
- 管理操作は既存の `admin_users` による認可へ限定する。
- RLS、GRANT / REVOKE、ソフト削除、予約番号、冪等再送、枠モード変更の整合性を保護する。

## migration整理方針

- 予約機能はまだ `main` と本番DBへ未適用のため、レビュー修正で増えた複数migrationをマージ前に1本へsquashする。
- 最終状態を1つのmigrationで定義し、同じRPC・policy・trigger・constraintを後続migrationで繰り返し再定義しない。
- 公開予約の業務ルールは公開RPCを正規のwrite boundaryとし、テーブル制約は行単体の整合性、triggerは管理操作の構造的整合性・競合制御に限定する。
- 自由席予約と予約枠追加の競合、枠定員変更、枠の公演移動は必要な行ロックとtriggerで保護する。
- 予約RPCはイベント行→予約枠行の順でロックし、枠ロック待ち後に終了時刻・枠開始時刻を再評価する。

## レビュー方針

- レビュー対象はsquash後のmigration適用完了状態と、実際にサポートするデプロイ状態とする。
- 未マージの過去migration prefixを独立した本番状態として維持するための重複実装は行わない。
- 既に共有・本番環境へ適用済みのmigrationはsquash対象にせず、forward-onlyで修正する。

## 確認方針

- `main` と接続可能な本番Supabaseのmigration履歴を確認してからsquashする。
- GitHub Actions CIを確認する。
- 可能なら隔離DBでfresh migrationとpgTAPを実行する。共有・本番DBへ検証目的でapplyしない。
