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

## レビュー方針

- PRレビューで指摘を出す前に、同じPRの既存レビュー、解決済みスレッド、対応コミット、現在の実装を確認し、同趣旨の指摘が既に議論・対応されていないか確認する。
- Before raising a PR review finding, inspect prior reviews, resolved threads, fix commits, and the current implementation in the same PR to determine whether the same concern has already been discussed or addressed.
- 過去のレビュー結論やResolve状態は文脈として必ず考慮するが、それ自体を正しさの根拠とはしない。現在のコードと事実を再検証すること。
- Treat prior review conclusions and resolved state as required context, not as proof of correctness. Re-validate them against the current code and facts.
- 既存のレビュー結論と矛盾する指摘、または一度非該当・誤検知と判断された指摘を再度出す場合は、過去の結論がなぜ現在は成立しないのかを示す新しい具体的根拠を確認したうえで、その差分をレビューコメントに明記する。
- If a new finding contradicts a prior review conclusion, or repeats a concern previously judged non-applicable or a false positive, first verify concrete new evidence showing why the prior conclusion no longer holds, and explicitly state that delta in the review comment.
- 外部API、Webhookイベント名、ライブラリ仕様、バージョン依存の挙動などを根拠に指摘する場合は、推測や古い知識だけで断定せず、可能な限り対象バージョンの一次情報・公式仕様を確認する。
- When a finding depends on an external API, webhook event name, library behavior, or version-specific semantics, do not rely only on assumptions or stale knowledge; verify the applicable version against authoritative or official documentation whenever possible.
- 既に修正済みの問題、過去指摘の単なる言い換え、根拠のない仮説は新規指摘として重複投稿しない。一方、修正後にも残る別経路・競合条件・回帰がある場合は、新しい根拠を具体的に示して指摘してよい。
- Do not post already-fixed issues, paraphrases of prior findings, or unsupported hypotheticals as new findings. If a distinct path, race condition, or regression remains after the earlier fix, it may be raised when the new evidence is stated concretely.
- レビューでは最新HEADの実装を基準とし、古いdiffや古いコミットだけを根拠に現在も問題が存在すると判断しない。
- Review the latest HEAD as the source of truth; do not conclude that an issue still exists solely from an outdated diff or earlier commit.

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
