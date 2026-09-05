# チケット予約DB・セキュリティ実装計画

## 対象

- `ticket_events`、`ticket_windows`、`ticket_reservations` のスキーマを追加する。
- 公開予約は `SECURITY DEFINER` RPC に限定し、公開状態・受付期間・枠所属・開始時刻・数量・残数をDB内で検証する。
- 管理操作は既存の `admin_users` による認可へ限定する。
- RLS、GRANT / REVOKE、ソフト削除、予約番号、冪等再送、枠モード変更の整合性を保護する。

## レビュー対応方針

- 各migration単体の適用直後でも危険な中間状態を作らない。
- 匿名・非管理authenticatedユーザーの直接書き込みを初期migrationから閉じる。
- 開始済み予約枠は、最初に公開される予約RPCの段階から拒否する。
- 予約番号衝突、ロック順、冪等RPCの引数互換性を後続migrationで補強する。

## 確認方針

- GitHub ActionsのCIを確認する。
- migrationの順序と各時点のRLS / 権限 / RPC挙動をレビューする。
- 既存の公開予約仕様と管理者認可を変更しない範囲で修正する。
