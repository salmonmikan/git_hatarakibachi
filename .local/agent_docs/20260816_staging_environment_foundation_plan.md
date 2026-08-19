# staging environment foundation plan

## 目的

`main` を本番、`staging` を検証用の統合ブランチとして運用し、Supabase の検証先を本番から分離する。

## 実施計画

1. `yuki` 組織の `ap-northeast-1` に無料枠内の staging 用 Supabase プロジェクトを作成する。
2. 現在の `develop` と同じコミットから `staging` ブランチを作成する。
3. CI、Deploy、運用文書の統合先を `develop` から `staging` に置き換える。
4. 新PRを `staging` 向きに作成し、差分を確認する。

## 範囲外

- 既存 `develop` ブランチの削除
- branch protection の新設
- GitHub Secrets、APIキー、DBパスワードの参照または登録
- production 環境へのデプロイ
