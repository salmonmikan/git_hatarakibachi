# チケット予約DB・セキュリティ実装結果

## 実装結果

- チケット販売ページ、予約枠、予約テーブルと必要なインデックスを追加した。
- 公開予約はRPC経由に限定し、イベント公開状態、Sanity連携、受付期間、予約枠所属、数量、残数をDB内で検証する構成にした。
- 初期migrationから匿名直接INSERTと非管理authenticatedユーザーの管理操作を閉じた。
- 最初に公開される予約RPCと後続の冪等RPCの双方で、window行ロック取得後の `clock_timestamp()` を使って開始済み枠を拒否する。
- `sanity_performance_id` が空の既存published行が `NOT VALID` 制約のため残っていても、公開RPCとacceptance triggerで予約を拒否する。
- 予約番号衝突時の再生成、ロック順のデッドロック回避、note省略可能な冪等RPC互換経路を追加した。
- 管理操作は `admin_users.uuid = auth.uid()` を基準に認可する。

## レビュー対応

- 匿名直接INSERT、authenticated全操作、予約番号衝突、ロック順、冪等RPC引数、開始済み枠の中間migration問題を修正した。
- 後続RPCでもwindowロック待ち後に現在時刻を再評価し、Sanity未連携のpublishedイベントをRPC経由でも予約不可にした。
- 各指摘はmigration適用順を含めて再確認し、後続migrationだけに依存しない形へ寄せた。

## 検証

- GitHub Actions CIで継続検証する。
- PRのレビュー指摘は修正後に再レビューを依頼する。
