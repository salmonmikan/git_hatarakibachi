import type { FunctionContext } from "../../_types"
import {
  firstDayOfMonth,
  jsonResponse,
  normalizeEmail,
  readJson,
  squareRequest,
  supabaseRequest,
  type MemberFeeEnv,
} from "../../_memberFee"

type Money = {
  amount?: number
  currency?: string
}

type SquareSubscription = {
  id?: string
  customer_id?: string
  plan_variation_id?: string
  start_date?: string
  status?: string
}

type SquareInvoicePaymentRequest = {
  due_date?: string
  computed_amount_money?: Money
  total_completed_amount_money?: Money
}

type SquareInvoice = {
  id?: string
  subscription_id?: string
  status?: string
  sale_or_service_date?: string
  primary_recipient?: {
    customer_id?: string
    email_address?: string
  }
  payment_requests?: SquareInvoicePaymentRequest[]
}

type SquareWebhookEvent = {
  event_id?: string
  type?: string
  created_at?: string
  data?: {
    object?: {
      subscription?: SquareSubscription
      invoice?: SquareInvoice
    }
  }
}

type BillingRow = {
  id: number
  member_id: number
  billing_email: string | null
  square_customer_id: string | null
  square_subscription_id: string | null
  subscription_status: string
  started_at: string | null
}

type SquareCustomerResponse = {
  customer?: {
    id?: string
    email_address?: string
  }
}

type SquareSubscriptionResponse = {
  subscription?: SquareSubscription
}

const SUPPORTED_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "invoice.payment_made",
  "invoice.scheduled_charge_failed",
])

async function verifySquareSignature(
  signature: string,
  rawBody: string,
  notificationUrl: string,
  signatureKey: string,
) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(signatureKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    )
    const signatureBytes = Uint8Array.from(atob(signature), (char) => char.charCodeAt(0))
    const payload = new TextEncoder().encode(`${notificationUrl}${rawBody}`)
    return crypto.subtle.verify("HMAC", key, signatureBytes, payload)
  } catch {
    return false
  }
}

async function claimEvent(env: MemberFeeEnv, event: SquareWebhookEvent) {
  const response = await supabaseRequest(
    env,
    "/rest/v1/rpc/claim_square_webhook_event",
    {
      method: "POST",
      body: JSON.stringify({
        p_event_id: event.event_id,
        p_event_type: event.type,
      }),
    },
  )
  return readJson<boolean>(response, "Square webhook event claim")
}

async function markEvent(
  env: MemberFeeEnv,
  eventId: string,
  status: "processed" | "ignored" | "unmatched" | "error",
  detail?: string,
) {
  const params = new URLSearchParams({ event_id: `eq.${eventId}` })
  const response = await supabaseRequest(
    env,
    `/rest/v1/square_webhook_events?${params.toString()}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status,
        detail: detail?.slice(0, 2000) ?? null,
        processed_at: new Date().toISOString(),
      }),
    },
  )
  if (!response.ok) await readJson(response, "Square webhook event update")
}

async function selectBilling(env: MemberFeeEnv, filterName: string, value: string) {
  const params = new URLSearchParams({
    select: "id,member_id,billing_email,square_customer_id,square_subscription_id,subscription_status,started_at",
    [filterName]: `eq.${value}`,
    limit: "1",
  })
  const response = await supabaseRequest(env, `/rest/v1/member_billing?${params.toString()}`)
  const rows = await readJson<BillingRow[]>(response, "member billing lookup")
  return rows[0] ?? null
}

async function findBilling(
  env: MemberFeeEnv,
  subscriptionId?: string,
  customerId?: string,
  email?: string,
) {
  if (subscriptionId) {
    const row = await selectBilling(env, "square_subscription_id", subscriptionId)
    if (row) return row
  }
  if (customerId) {
    const row = await selectBilling(env, "square_customer_id", customerId)
    if (row) return row
  }
  const normalizedEmail = normalizeEmail(email)
  if (normalizedEmail) {
    const row = await selectBilling(env, "billing_email", normalizedEmail)
    if (row) return row
  }
  return null
}

async function updateBilling(env: MemberFeeEnv, billingId: number, payload: Record<string, unknown>) {
  const params = new URLSearchParams({ id: `eq.${billingId}` })
  const response = await supabaseRequest(
    env,
    `/rest/v1/member_billing?${params.toString()}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
    },
  )
  if (!response.ok) await readJson(response, "member billing update")
}

async function retrieveCustomerEmail(env: MemberFeeEnv, customerId: string) {
  const response = await squareRequest(env, `/v2/customers/${encodeURIComponent(customerId)}`)
  const body = await readJson<SquareCustomerResponse>(response, "Square customer retrieval")
  return normalizeEmail(body.customer?.email_address)
}

async function retrieveSubscription(env: MemberFeeEnv, subscriptionId: string) {
  const response = await squareRequest(env, `/v2/subscriptions/${encodeURIComponent(subscriptionId)}`)
  const body = await readJson<SquareSubscriptionResponse>(response, "Square subscription retrieval")
  return body.subscription ?? null
}

async function processSubscriptionEvent(env: MemberFeeEnv, event: SquareWebhookEvent) {
  const subscription = event.data?.object?.subscription
  if (!subscription?.id || !subscription.customer_id) {
    throw new Error("Subscription webhook does not contain required identifiers")
  }
  if (subscription.plan_variation_id !== env.SQUARE_MEMBER_FEE_PLAN_VARIATION_ID) {
    return { status: "ignored" as const, detail: "Subscription uses another plan variation" }
  }

  let billing = await findBilling(env, subscription.id, subscription.customer_id)
  if (!billing) {
    const customerEmail = await retrieveCustomerEmail(env, subscription.customer_id)
    billing = await findBilling(env, subscription.id, subscription.customer_id, customerEmail)
  }
  if (!billing) {
    return { status: "unmatched" as const, detail: `Subscription ${subscription.id} could not be linked to a member` }
  }

  await updateBilling(env, billing.id, {
    square_customer_id: subscription.customer_id,
    square_subscription_id: subscription.id,
    subscription_status: subscription.status || "UNKNOWN",
    started_at: billing.started_at || subscription.start_date || event.created_at || null,
  })
  return { status: "processed" as const }
}

function paymentRequestForInvoice(invoice: SquareInvoice) {
  return invoice.payment_requests?.[0] ?? null
}

async function getExistingPaymentStatus(env: MemberFeeEnv, memberId: number, targetMonth: string) {
  const params = new URLSearchParams({
    select: "status",
    member_id: `eq.${memberId}`,
    target_month: `eq.${targetMonth}`,
    limit: "1",
  })
  const response = await supabaseRequest(env, `/rest/v1/member_fee_payments?${params.toString()}`)
  const rows = await readJson<Array<{ status: string }>>(response, "member fee payment lookup")
  return rows[0]?.status ?? null
}

async function upsertPayment(
  env: MemberFeeEnv,
  payload: {
    member_id: number
    target_month: string
    amount: number
    currency: string
    square_invoice_id: string
    status: string
    paid_at: string | null
  },
) {
  const params = new URLSearchParams({ on_conflict: "member_id,target_month" })
  const response = await supabaseRequest(
    env,
    `/rest/v1/member_fee_payments?${params.toString()}`,
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
    },
  )
  if (!response.ok) await readJson(response, "member fee payment upsert")
}

async function processInvoiceEvent(env: MemberFeeEnv, event: SquareWebhookEvent) {
  const invoice = event.data?.object?.invoice
  if (!invoice?.id || !invoice.subscription_id) {
    return { status: "ignored" as const, detail: "Invoice is not a subscription billing invoice" }
  }

  // 既に団員費Subscriptionとして紐付いたID以外は、SquareからPlan Variationを確認してから
  // customer/emailによる紐付けへ進む。別用途のSquare Subscriptionを誤計上しないため。
  let billing = await findBilling(env, invoice.subscription_id)
  let subscription: SquareSubscription | null = null
  if (!billing) {
    subscription = await retrieveSubscription(env, invoice.subscription_id)
    if (!subscription || subscription.plan_variation_id !== env.SQUARE_MEMBER_FEE_PLAN_VARIATION_ID) {
      return { status: "ignored" as const, detail: "Invoice belongs to another subscription plan" }
    }

    billing = await findBilling(
      env,
      subscription.id,
      subscription.customer_id || invoice.primary_recipient?.customer_id,
      invoice.primary_recipient?.email_address,
    )
  }

  if (!billing) {
    return { status: "unmatched" as const, detail: `Invoice ${invoice.id} could not be linked to a member` }
  }

  const paymentRequest = paymentRequestForInvoice(invoice)
  const dueDate = paymentRequest?.due_date || invoice.sale_or_service_date || event.created_at?.slice(0, 10)
  const targetMonth = firstDayOfMonth(dueDate)
  const computedAmount = paymentRequest?.computed_amount_money?.amount ?? 0
  const completedAmount = paymentRequest?.total_completed_amount_money?.amount ?? 0
  const currency = paymentRequest?.computed_amount_money?.currency
    || paymentRequest?.total_completed_amount_money?.currency
    || "JPY"

  if (event.type === "invoice.payment_made") {
    const fullyPaid = invoice.status === "PAID" || (computedAmount > 0 && completedAmount >= computedAmount)
    const paymentStatus = fullyPaid ? "PAID" : "PARTIAL"
    await upsertPayment(env, {
      member_id: billing.member_id,
      target_month: targetMonth,
      amount: completedAmount || computedAmount,
      currency,
      square_invoice_id: invoice.id,
      status: paymentStatus,
      paid_at: event.created_at || new Date().toISOString(),
    })
    await updateBilling(env, billing.id, {
      square_customer_id: billing.square_customer_id || subscription?.customer_id || invoice.primary_recipient?.customer_id || null,
      square_subscription_id: invoice.subscription_id,
      subscription_status: subscription?.status || billing.subscription_status,
      last_payment_at: event.created_at || new Date().toISOString(),
      last_payment_status: paymentStatus,
    })
    return { status: "processed" as const }
  }

  const existingStatus = await getExistingPaymentStatus(env, billing.member_id, targetMonth)
  if (existingStatus !== "PAID") {
    await upsertPayment(env, {
      member_id: billing.member_id,
      target_month: targetMonth,
      amount: computedAmount,
      currency,
      square_invoice_id: invoice.id,
      status: "FAILED",
      paid_at: null,
    })
    await updateBilling(env, billing.id, {
      square_customer_id: billing.square_customer_id || subscription?.customer_id || invoice.primary_recipient?.customer_id || null,
      square_subscription_id: invoice.subscription_id,
      subscription_status: subscription?.status || billing.subscription_status,
      last_payment_status: "FAILED",
    })
  }
  return { status: "processed" as const }
}

export const onRequestPost = async ({ request, env }: FunctionContext<MemberFeeEnv>) => {
  if (!env.SQUARE_WEBHOOK_SIGNATURE_KEY || !env.SQUARE_MEMBER_FEE_PLAN_VARIATION_ID || !env.SQUARE_ACCESS_TOKEN) {
    return jsonResponse({ error: "Webhook configuration is incomplete" }, 503)
  }

  const rawBody = await request.text()
  const signature = request.headers.get("x-square-hmacsha256-signature") ?? ""
  const notificationUrl = env.SQUARE_WEBHOOK_NOTIFICATION_URL || request.url
  const validSignature = await verifySquareSignature(
    signature,
    rawBody,
    notificationUrl,
    env.SQUARE_WEBHOOK_SIGNATURE_KEY,
  )
  if (!validSignature) {
    return jsonResponse({ error: "Invalid webhook signature" }, 403)
  }

  let event: SquareWebhookEvent
  try {
    event = JSON.parse(rawBody) as SquareWebhookEvent
  } catch {
    return jsonResponse({ error: "Invalid webhook payload" }, 400)
  }

  if (!event.event_id || !event.type) {
    return jsonResponse({ error: "Webhook event identifiers are missing" }, 400)
  }

  try {
    const claimed = await claimEvent(env, event)
    if (!claimed) return jsonResponse({ ok: true, duplicate: true })

    if (!SUPPORTED_EVENTS.has(event.type)) {
      await markEvent(env, event.event_id, "ignored", `Unsupported event type: ${event.type}`)
      return jsonResponse({ ok: true, ignored: true })
    }

    const result = event.type.startsWith("subscription.")
      ? await processSubscriptionEvent(env, event)
      : await processInvoiceEvent(env, event)

    await markEvent(env, event.event_id, result.status, result.detail)
    return jsonResponse({ ok: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown webhook processing error"
    console.error("Square webhook processing failed", error)
    try {
      await markEvent(env, event.event_id, "error", detail)
    } catch (markError) {
      console.error("Square webhook error status update failed", markError)
    }
    return jsonResponse({ error: "Webhook processing failed" }, 500)
  }
}
