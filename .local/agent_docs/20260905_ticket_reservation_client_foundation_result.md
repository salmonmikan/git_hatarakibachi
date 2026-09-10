# チケット予約共通クライアント基盤 実装結果

## 実装結果

- 公開イベント取得、予約作成、管理者キャンセルのSupabase呼び出しを共通関数へ整理した。
- `fetchPublishedTicketEvent(slug)` は `get_public_ticket_event` RPCを1回だけ呼び、イベント・予約枠・残数・枠履歴をDB側の同一スナップショットから受け取る構成へ単純化した。
- 従来のイベントSELECT、availability RPC、history RPC、イベント再確認と、その間のstale判定・列比較を削除した。
- `datetime-local` と保存ISO日時の変換、受付境界、予約可能枚数の計算を共通化した。
- request ID付きcanonical予約RPCを呼び出し、任意の備考と自由席のwindow IDは未指定時も `null` を明示送信する。
- 終了境界ちょうどでも一度タイマー再評価対象に残し、DB側の境界条件を変えずに表示が受付中のまま残る問題を防いだ。
- 境界時刻ちょうどの挙動をテストへ追加した。

## レビュー対応

- 公開readの複数リクエスト間で枠追加・削除・受付日時・`starts_at` 等を個別に比較する方式は、同種のraceを列単位で追い続けるため廃止した。
- canonical read RPCを単一の権威スナップショットとし、クライアントは返却値をそのまま表示モデルとして扱う。
- note自体は公開予約フォームの任意項目として維持し、canonical write RPC化後も未指定値がfunction解決から落ちないよう `null` を明示送信する。
- 受付終了境界の再評価問題は、DB契約に合わせてタイマー側を修正した。

## 検証

- Node標準テストとGitHub Actions CIで継続検証する。
- canonical public readは親PRのpgTAPで権限、枠履歴、残数を同時検証する。
- 共通クライアント層にUI固有状態やstale世代管理を持ち込んでいないことを確認する。
