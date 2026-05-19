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
- 変更は依頼された範囲に限定する。関係のないリファクタや整形の巻き込みは避ける。
- Limit changes to the requested scope. Avoid unrelated refactors or formatting-only churn.
- 実装前に関連ファイルを確認し、既存の設計、命名、ディレクトリ構成に合わせる。
- Review the related files before implementing, and follow the existing design, naming, and directory structure.
- 既存の未コミット変更はユーザーの作業として扱い、勝手に戻さない。
- Treat existing uncommitted changes as the user's work and never revert them without permission.

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
