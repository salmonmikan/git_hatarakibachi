# チケット予約: Turnstile / Rate Limit 設定

公開チケット予約のwriteは `/api/tickets/reservations` のCloudflare Pages Functionを経由します。公開イベントのreadは従来どおりSupabaseの `get_public_ticket_event` RPCを直接利用します。

## 必要な環境変数

### フロントエンド

Cloudflare Pagesのビルド環境へ次を設定します。

- `VITE_TURNSTILE_SITE_KEY`: 対象環境のTurnstile Site Key

### Pages Functions

Cloudflare PagesのSecret / Environment Variablesへ次を設定します。値はリポジトリへ保存しません。

- `TURNSTILE_SECRET_KEY`: 対象環境のTurnstile Secret Key
- `SUPABASE_URL`: 対象Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: サーバー専用Supabase credential

`SUPABASE_SERVICE_ROLE_KEY` はブラウザへ公開しないでください。将来Supabaseの専用secret keyへ切り替える場合も、同様にPages Functionsのサーバー側Secretとして管理します。

## Turnstile

- Widget mode: Managed
- 実装action: `ticket_reservation`
- Production / Stagingはwidgetを分離する
- 各widgetの許可hostnameに対象環境のhostnameを登録する
- Pages FunctionはSiteverifyの `success`、`action`、`hostname` を検証する

ローカル・自動テストではCloudflare公式のTurnstile test keyをローカル環境変数で使用できます。実値をコミットしないでください。

## Cloudflare Rate Limiting Rule

WAFのRate Limiting Ruleを次の予約write endpointに設定します。

- Path: `/api/tickets/reservations`
- 初期値: 同一IPから `5 requests / 10 seconds`
- Mitigation timeout: `10 seconds`

これは初期値です。実運用で正規ユーザーを誤検知する場合はログを確認して調整します。TurnstileとRate Limitは役割が異なるため、両方を有効にします。

## Supabase権限

`public.create_ticket_reservation(...)` は `anon` / `authenticated` から直接実行できません。Pages Functionがサーバーcredentialで実行します。

このため、ブラウザからSupabase Data APIへ直接予約writeしてTurnstileやCloudflare Rate Limitを迂回する経路は閉じられます。

## デプロイ順

1. Turnstile widgetを環境ごとに作成
2. Pagesへ `VITE_TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`、Supabaseサーバー設定を登録
3. `/api/tickets/reservations` のRate Limiting Ruleを作成
4. アプリとDB migrationを同じリリース単位で反映
5. Stagingで通常予約・再送・Turnstile失敗・Rate Limitを確認

アプリだけ先行してDB権限を閉じる、またはDBだけ先行してブラウザ直RPCを閉じる中間リリースは避けてください。
