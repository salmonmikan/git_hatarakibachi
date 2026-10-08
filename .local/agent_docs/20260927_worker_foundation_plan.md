# Issue #64 64-1: Workers + Static Assets 移行基盤 計画

## 目的

現行Cloudflare Pages / Pages Functionsの本番挙動を維持したまま、Cloudflare Workers + Static Assetsへ段階移行できる基盤を追加する。

## 方針

- 現行 `functions/` は削除しない。
- Pages FunctionsとWorkerで既存handler実装を共有し、業務ロジックを二重実装しない。
- Workerは明示的なroute dispatcherで現行APIを再現する。
- API/画像route以外はWorkers Static Assetsへ委譲する。
- React SPAの直リンクはWorkers Static AssetsのSPA fallbackで維持する。
- Sanity preview cookie時の `Cache-Control: private, no-store` / `X-Robots-Tag: noindex, nofollow` をWorkerでも維持する。
- 本PRでは本番deploy・custom domain・Secrets変更を行わない。

## 対象

- `/api/draft`
- `/api/disable-draft`
- `/api/web-members`
- `/api/web-sitenews`
- `/img/*`
- `/api/img-url` の現行無効状態
- Static Assets / SPA fallback

## 検証

- ESLint
- Node routing tests
- Vite build
- Pages Functions build
- Worker dry-run build
- Sanity build
- fresh Supabase migration reset

## 後続

64-2でGitHub Actions + WranglerによるStaging Worker deploy、64-3でProduction cutoverを行う。
