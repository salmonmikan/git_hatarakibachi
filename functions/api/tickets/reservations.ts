import type { FunctionContext } from "../../_types"

type TicketReservationEnv = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  TURNSTILE_SECRET_KEY: string
}

type ReservationRequest = {
  event_id?: unknown
  window_id?: unknown
  customer_name?: unknown
  customer_email?: unknown
  quantity?: unknown
  note?: unknown
  request_id?: unknown
  turnstile_token?: unknown
}

type ValidReservationRequest = {
  event_id: number
  window_id: number | null
  customer_name: string
  customer_email: string
  quantity: number
  note: string | null
  request_id: string
  turnstile_token: string
}

type TurnstileResult = {
  success?: boolean
  hostname?: string
  action?: string
  "error-codes"?: string[]
}

type SupabaseError = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

const MAX_REQUEST_BYTES = 8192
const TURNSTILE_ACTION = "ticket_reservation"
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

function validateReservationRequest(body: ReservationRequest | null): ValidReservationRequest | null {
  if (!body) return null

  const eventId = Number(body.event_id)
  const windowId = body.window_id === null || body.window_id === undefined
    ? null
    : Number(body.window_id)
  const quantity = Number(body.quantity)
  const customerName = typeof body.customer_name === "string" ? body.customer_name.trim() : ""
  const customerEmail = typeof body.customer_email === "string" ? body.customer_email.trim() : ""
  const note = body.note === null || body.note === undefined
    ? null
    : typeof body.note === "string" ? body.note.trim() || null : undefined
  const requestId = typeof body.request_id === "string" ? body.request_id.trim() : ""
  const turnstileToken = typeof body.turnstile_token === "string" ? body.turnstile_token.trim() : ""

  if (!Number.isSafeInteger(eventId) || eventId <= 0) return null
  if (windowId !== null && (!Number.isSafeInteger(windowId) || windowId <= 0)) return null
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return null
  if (!customerName || customerName.length > 200) return null
  if (!customerEmail || customerEmail.length > 320 || !EMAIL_PATTERN.test(customerEmail)) return null
  if (note === undefined || (note !== null && note.length > 2000)) return null
  if (!UUID_PATTERN.test(requestId)) return null
  if (!turnstileToken || turnstileToken.length > 2048) return null

  return {
    event_id: eventId,
    window_id: windowId,
    customer_name: customerName,
    customer_email: customerEmail,
    quantity,
    note,
    request_id: requestId,
    turnstile_token: turnstileToken,
  }
}

async function verifyTurnstile(
  request: Request,
  env: TicketReservationEnv,
  payload: ValidReservationRequest,
) {
  const form = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: payload.turnstile_token,
  })
  const remoteIp = request.headers.get("CF-Connecting-IP")?.trim()
  if (remoteIp) form.set("remoteip", remoteIp)

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
  })
  if (!response.ok) {
    throw new Error(`Turnstile Siteverify failed (${response.status})`)
  }

  const result = await response.json() as TurnstileResult
  const expectedHostname = new URL(request.url).hostname
  return result.success === true
    && result.action === TURNSTILE_ACTION
    && result.hostname === expectedHostname
}

async function createReservation(env: TicketReservationEnv, payload: ValidReservationRequest) {
  const response = await fetch(
    `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/create_ticket_reservation`,
    {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({
        p_event_id: payload.event_id,
        p_window_id: payload.window_id,
        p_customer_name: payload.customer_name,
        p_customer_email: payload.customer_email,
        p_quantity: payload.quantity,
        p_note: payload.note,
        p_request_id: payload.request_id,
      }),
    },
  )

  const text = await response.text()
  if (!response.ok) {
    let error: SupabaseError = {}
    try {
      error = JSON.parse(text) as SupabaseError
    } catch {
      // PostgREST以外の応答は上流障害として扱う。
    }
    return { response, error }
  }

  const rows = text ? JSON.parse(text) as Array<{ reservation_code?: string }> : []
  const reservationCode = rows[0]?.reservation_code?.trim() ?? ""
  if (!reservationCode) {
    throw new Error("Reservation RPC returned no reservation code")
  }

  return { response, reservationCode }
}

export const onRequestPost = async ({ request, env }: FunctionContext<TicketReservationEnv>) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.TURNSTILE_SECRET_KEY) {
    return jsonResponse({ error: "予約受付のサーバー設定が完了していません。" }, 503)
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
  if (!contentType.startsWith("application/json")) {
    return jsonResponse({ error: "JSON形式で送信してください。", code: "INVALID_REQUEST" }, 415)
  }

  const declaredLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: "送信内容が大きすぎます。", code: "INVALID_REQUEST" }, 413)
  }

  const rawBody = await request.text()
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: "送信内容が大きすぎます。", code: "INVALID_REQUEST" }, 413)
  }

  let parsed: ReservationRequest | null = null
  try {
    parsed = JSON.parse(rawBody) as ReservationRequest
  } catch {
    return jsonResponse({ error: "送信内容を確認してください。", code: "INVALID_REQUEST" }, 400)
  }

  const payload = validateReservationRequest(parsed)
  if (!payload) {
    return jsonResponse({ error: "予約内容を確認してください。", code: "INVALID_REQUEST" }, 400)
  }

  try {
    const verified = await verifyTurnstile(request, env, payload)
    if (!verified) {
      return jsonResponse({ error: "セキュリティ確認に失敗しました。もう一度お試しください。", code: "TURNSTILE_FAILED" }, 403)
    }
  } catch (error) {
    console.error("ticket reservation turnstile verification failed", {
      requestId: payload.request_id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return jsonResponse({ error: "セキュリティ確認を完了できませんでした。もう一度お試しください。", code: "TURNSTILE_UNAVAILABLE" }, 503)
  }

  try {
    const result = await createReservation(env, payload)
    if ("error" in result) {
      const upstreamCode = result.error.code?.trim() ?? ""
      // private.create_ticket_reservation が意図的に返す P0001 だけを
      // 「RPCが実行され、予約不成立が確定した業務エラー」と扱う。
      // 認証失敗・PGRSTルーティング・設定不備などは、前回送信の結果を
      // 否定できないため結果不明の上流障害として扱う。
      const businessFailure = upstreamCode === "P0001"
      console.warn("ticket reservation Supabase RPC failed", {
        requestId: payload.request_id,
        status: result.response.status,
        code: upstreamCode || undefined,
        businessFailure,
      })
      return jsonResponse(
        businessFailure
          ? {
              error: result.error.message || "予約を受け付けられませんでした。",
              code: upstreamCode,
            }
          : {
              error: "予約結果を確認できませんでした。再確認してください。",
            },
        businessFailure ? 422 : 502,
      )
    }

    return jsonResponse({ reservation_code: result.reservationCode })
  } catch (error) {
    console.error("ticket reservation upstream request failed", {
      requestId: payload.request_id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return jsonResponse({ error: "予約結果を確認できませんでした。再確認してください。" }, 502)
  }
}
