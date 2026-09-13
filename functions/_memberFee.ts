export type MemberFeeEnv = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SQUARE_ACCESS_TOKEN?: string
  SQUARE_LOCATION_ID?: string
  SQUARE_MEMBER_FEE_PLAN_VARIATION_ID?: string
  SQUARE_WEBHOOK_SIGNATURE_KEY?: string
  SQUARE_WEBHOOK_NOTIFICATION_URL?: string
  SQUARE_ENVIRONMENT?: string
  SQUARE_API_VERSION?: string
}

export const MEMBER_FEE_AMOUNT = 1000
export const MEMBER_FEE_CURRENCY = "JPY"
export const SQUARE_API_VERSION = "2026-08-19"

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function isValidEmail(value: string) {
  return value.length <= 256 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function firstDayOfMonth(value: string | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})-\d{2}/)
  if (match) return `${match[1]}-${match[2]}-01`

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}-01`
}

export async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function supabaseRequest(
  env: MemberFeeEnv,
  path: string,
  init: RequestInit = {},
) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service configuration is missing")
  }

  const headers = new Headers(init.headers)
  headers.set("apikey", env.SUPABASE_SERVICE_ROLE_KEY)
  headers.set("authorization", `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`)
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  return fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
  })
}

export function squareBaseUrl(env: MemberFeeEnv) {
  return env.SQUARE_ENVIRONMENT?.toLowerCase() === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com"
}

export async function squareRequest(
  env: MemberFeeEnv,
  path: string,
  init: RequestInit = {},
) {
  if (!env.SQUARE_ACCESS_TOKEN) {
    throw new Error("Square access token is missing")
  }

  const headers = new Headers(init.headers)
  headers.set("authorization", `Bearer ${env.SQUARE_ACCESS_TOKEN}`)
  headers.set("square-version", env.SQUARE_API_VERSION || SQUARE_API_VERSION)
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  return fetch(`${squareBaseUrl(env)}${path}`, {
    ...init,
    headers,
  })
}

export async function readJson<T>(response: Response, label: string): Promise<T> {
  const text = await response.text()
  if (!response.ok) {
    let detail = text
    try {
      const parsed = JSON.parse(text) as { errors?: Array<{ detail?: string }> }
      detail = parsed.errors?.map((item) => item.detail).filter(Boolean).join(" / ") || text
    } catch {
      // JSONでないエラー本文はそのまま診断情報として扱う。
    }
    throw new Error(`${label} failed (${response.status})${detail ? `: ${detail}` : ""}`)
  }

  if (!text) return undefined as T
  return JSON.parse(text) as T
}
