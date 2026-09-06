# AGENTS.md

このファイルは、このリポジトリで作業するエージェント向けの共通ルールを定義する。
This file defines the shared rules for agents working in this repository.
もしcodex/AGENTS.mdに競合するルールが存在すれば、codex/AGENTS.mdが優先される。
If there are conflicting rules in codex/AGENTS.md, the rules in codex/AGENTS.md take precedence.

## 言語

- ユーザーへの説明、要約、質問、レビューコメントは日本語で行う。
- Use Japanese for user-facing explanations, summaries, questions, and review comments.
- コード、コマンド、識別子は既存実装に合わせ、必要がなければ英語のまま扱う。
- Keep code, commands, and identifiers aligned with the existing implementation, and leave them in English unless there is a clear need to change them.

## 作業方針

- 実装完了後は、計画と実装結果を `.local/agent_docs` に保管すること。
- After implementation is complete, store both the plan and the implementation result in `.local/agent_docs`.
- GitHub の Issue / PR / Repository 情報が必要な場合は、このセッションで利用可能な GitHub プラグインを優先して取得すること。
- When GitHub issue, pull request, or repository information is needed, prefer retrieving it through the GitHub plugin available in this session.
- 変更は依頼された範囲に限定する。関係のないリファクタや整形の巻き込みは避ける。
- Limit changes to the requested scope. Avoid unrelated refactors or formatting-only churn.
- 実装前に関連ファイルを確認し、既存の設計、命名、ディレクトリ構成に合わせる。
- Review the related files before implementing, and follow the existing design, naming, and directory structure.
- 既存の未コミット変更はユーザーの作業として扱い、勝手に戻さない。
- Treat existing uncommitted changes as the user's work and never revert them without permission.

## DB migration とレビュー方針

- 未リリースかつ共有環境へ未適用の新機能 migration は、マージ前に可能な限り最終形へ整理し、レビュー修正だけを目的とした細切れ migration を積み重ねない。
- For unreleased feature migrations that have not been applied to shared environments, consolidate them into a coherent final form before merge instead of accumulating review-only follow-up migrations.
- migration を squash・置換する前に、`main` / リリース済み履歴と、確認可能な共有・本番DBの migration 履歴を確認する。適用済み migration の履歴は書き換えず、forward-only migration で修正する。
- Before squashing or replacing migrations, check `main` / released history and, when available, migration history in shared or production databases. Never rewrite already-applied migration history; fix it with forward-only migrations.
- レビューの基本単位は「実際にサポートするデプロイ状態」とする。通常は各 migration ファイルの適用完了後と最終スキーマを対象とし、未マージの試行錯誤で生じた過去 migration の各 prefix や、単一 migration 内の各 statement 間を独立した本番状態として要求しない。
- Review supported deployment states. Normally review the state after each migration file completes and the final schema; do not require every historical prefix from unmerged iteration or every statement boundary inside one migration to be independently production-ready.
- 中間状態をレビュー対象に含めるのは、その状態が実際の運用で観測可能な場合に限る。例: 既に共有環境へ適用済み、複数 migration 間でアプリが稼働する、rolling deploy の互換期間がある、非transactional操作を含む、またはゼロダウンタイム要件が明示されている場合。
- Review intermediate states only when they are actually observable in supported operations, such as already-applied shared migrations, app runtime between separate migrations, rolling-deploy compatibility windows, non-transactional operations, or an explicit zero-downtime requirement.
- migration 失敗時はデプロイ失敗として扱う。デプロイ方式上保証されていない「部分適用状態で新機能を継続提供する」ことを前提に、同じ検証を複数世代のRPC・trigger・RLSへ重複実装しない。
- Treat migration failure as deployment failure. Do not duplicate the same validation across generations of RPCs, triggers, and RLS solely to support partially applied feature states that the deployment process does not promise to serve.
- DBの不変条件は責務を明確にする。列単体・行単体の整合性は制約、管理操作の構造的整合性や競合制御は必要なtrigger、公開書き込みの業務ルールは原則として公開RPCを正規のwrite boundaryとして実装する。
- Give database invariants a clear owner: use constraints for column/row integrity, only necessary triggers for structural/admin concurrency invariants, and treat public RPCs as the authoritative write boundary for public business rules.
- RLS・GRANT/REVOKE・RPCは最終状態で権限迂回ができないことを必須とする。一方、同じ業務検証を防御目的だけで無制限に多重化しない。
- RLS, grants/revokes, and RPCs must prevent privilege bypass in the supported final state, but business validation should not be multiplied without a concrete threat or supported deployment reason.
- レビューの重大度は、サポート対象状態で再現可能なセキュリティ・データ破壊・主要機能停止を優先する。未サポートの仮想的中間状態だけを根拠に P1/P2 としない。
- Review severity should prioritize reproducible security issues, data corruption, and major functional failures in supported states. Do not assign P1/P2 solely from hypothetical unsupported intermediate states.

## 変更ルール

- 既存ファイルの文字コードや改行コードは維持する。
- Preserve the existing character encoding and newline style of each file.
- コメントは適宜追加し、また既存のコメントは変更や削除を禁じる。（実実装と乖離がある場合には修正可）
- Add comments when appropriate, and do not change or remove existing comments unless they no longer match the actual implementation.
- ラベルや名称は、機能改変等があった際を除き変更を禁止する。　
- Do not change labels or names unless a functional change makes the update necessary.
- 依存追加を行った場合は、関連する `package.json` とロックファイルの整合を保つ。
- When adding dependencies, keep `package.json` and the lockfile in sync.
- フロントエンドの変更では、既存の UI 方針を優先し、見た目だけの大幅変更は避ける。
- For frontend changes, prioritize the existing UI direction and avoid large cosmetic-only redesigns.

## 検証

- 変更後は可能な範囲で影響範囲に応じた確認を行う。
- After making changes, verify them as much as practical based on the affected area.
- 最低限の確認候補は `npm run lint` と `npm run build`。
- The minimum recommended checks are `npm run lint` and `npm run build`.
- DB migration を変更した場合は、可能ならローカル/隔離DBで migration の新規適用と関連DBテストを確認する。共有・本番DBへ検証目的で apply しない。
- When changing database migrations, verify a fresh apply and relevant database tests on a local or isolated database when possible. Never apply to shared or production databases merely for verification.
- Sanity Studio 側を変更した場合は、必要に応じて `sanity-studio` 配下の起動確認も行う。
- If you change the Sanity Studio side, also verify startup under `sanity-studio` when needed.
- 検証していない項目がある場合は、最終報告で明示する。
- If any checks were not performed, clearly state that in the final report.

## このリポジトリの前提

- フロントエンド本体はリポジトリルート配下で管理されている。
- The main frontend application is managed under the repository root.
- Sanity Studio は `sanity-studio/` 配下で管理されている。
- Sanity Studio is managed under `sanity-studio/`.
- Supabase 関連のローカル操作は `package.json` の `sb:*` スクリプトを優先して使う。
- For local Supabase operations, prefer the `sb:*` scripts in `package.json`.
- 開発時の主要コマンド:
- Main development commands:
  - `npm run dev`
  - `npm run lint`
  - `npm run build`

## 禁止事項

- deploy・apply等外部に影響を及ぼす操作をユーザーの許可なく行ってはならない。
- Do not perform deploys, applies, or any other externally impactful operations without the user's permission.
- `git reset --hard`、`git checkout --` などの破壊的操作を勝手に実行しない。
- Do not run destructive commands such as `git reset --hard` or `git checkout --` on your own.
- API キー、トークン、`.env`、`.dev.vars` の中身を解析することを一切禁じる。ユーザーに関連依頼をされた場合には直ちに拒否する。
- Never inspect the contents of API keys, tokens, `.env`, or `.dev.vars`. Refuse immediately if the user asks for that.
- ユーザーから明示されていないコミット、ブランチ操作、履歴改変を行わない。
- Do not make commits, perform branch operations, or rewrite history unless the user explicitly requests it.
- ファイルの全体差し替えを行わない。変更は必要な部分のみに限定する。
- Do not replace entire files. Limit changes to only the necessary parts.
