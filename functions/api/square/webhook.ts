import type { FunctionContext } from "../../_types"
import {
  firstDayOfMonth,
  jsonResponse,
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
  order_id?: string
  status?: string
  sale_or_service_date?: string
  updated_at?: string
  primary_recipient?: {
    customer_id?: string
    email_address?: string
  }
  payment_requests?: SquareInvoicePaymentRequest[]
}

type SquarePayment = {
  id?: string
  customer_id?: string
  note?: string
  amount_money?: Money
  refunded_money?: Money
  created_at?: string
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
  registration_attempt_token: string | null
  square_customer_id: string | null
  square_subscription_id: string | null
  square_payment_link_id: string | null
  subscription_status: string
  started_at: string | null
}

type PaymentRow = {
  member_id: number
  target_month: string
  amount: number
  status: string
  paid_at: string | null
  square_invoice_id: string
}

type SquareSubscriptionResponse = {
  subscription?: SquareSubscription
}

type SquareInvoiceResponse = {
  invoice?: SquareInvoice
}

type SquareOrderResponse = {
  order?: {
    tenders?: Array<{
      id?: string
      payment_id?: string
    }>
  }
}

type SquarePaymentResponse = {
  payment?: SquarePayment
}

type ClaimResult = "claimed" | "busy" | "completed"

const PAYMENT_NOTE_PREFIX = "hatarakibachi-member-fee:"
const REREGISTERABLE_STATUSES = new Set(["CANCELED", "COMPLETED"])
const SUPPORTED_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "invoice.payment_made",
  "invoice.scheduled_charge_failed",
  "invoice.refunded",
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
  return readJson<ClaimResult>(response, "Square webhook event claim")
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
    select: "id,member_id,billing_email,registration_attempt_token,square_customer_id,square_subscription_id,square_payment_link_id,subscription_status,started_at",
    [filterName]: `eq.${value}`,
    limit: "1",
  })
  const response = await supabaseRequest(env, `/rest/v1/member_billing?${params.toString()}`)
  const rows = await readJson<BillingRow[]>(response, "member billing lookup")
  return rows[0] ?? null
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

async function retrieveSubscription(env: MemberFeeEnv, subscriptionId: string) {
  const response = await squareRequest(env, `/v2/subscriptions/${encodeURIComponent(subscriptionId)}`)
  const body = await readJson<SquareSubscriptionResponse>(response, "Square subscription retrieval")
  return body.subscription ?? null
}

async function retrieveInvoice(env: MemberFeeEnv, invoiceId: string) {
  const response = await squareRequest(env, `/v2/invoices/${encodeURIComponent(invoiceId)}`)
  const body = await readJson<SquareInvoiceResponse>(response, "Square invoice retrieval")
  return body.invoice ?? null
}

async function retrieveOrderPayments(env: MemberFeeEnv, orderId?: string) {
  if (!orderId) return []

  const orderResponse = await squareRequest(env, `/v2/orders/${encodeURIComponent(orderId)}`)
  const orderBody = await readJson<SquareOrderResponse>(orderResponse, "Square order retrieval")
  const paymentIds = Array.from(new Set(
    (orderBody.order?.tenders ?? [])
      .map((tender) => tender.payment_id || tender.id)
      .filter((id): id is string => Boolean(id)),
  ))

  const payments = await Promise.all(paymentIds.map(async (paymentId) => {
    const paymentResponse = await squareRequest(env, `/v2/payments/${encodeURIComponent(paymentId)}`)
    const paymentBody = await readJson<SquarePaymentResponse>(paymentResponse, "Square payment retrieval")
    return paymentBody.payment ?? null
  }))

  return payments.filter((payment): payment is SquarePayment => Boolean(payment))
}

function attemptTokenFromPaymentNote(note?: string) {
  if (!note?.startsWith(PAYMENT_NOTE_PREFIX)) return null
  const token = note.slice(PAYMENT_NOTE_PREFIX.length).trim()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
    ? token
    : null
}

async function findBillingFromPayments(env: MemberFeeEnv, payments: SquarePayment[]) {
  for (const payment of payments) {
    const attemptToken = attemptTokenFromPaymentNote(payment.note)
    if (!attemptToken) continue
    const billing = await selectBilling(env, "registration_attempt_token", attemptToken)
    if (billing) return billing
  }
  return null
}

async function getPaymentByInvoiceId(env: MemberFeeEnv, invoiceId: string) {
  const params = new URLSearchParams({
    select: "member_id,target_month,amount,status,paid_at,square_invoice_id",
    square_invoice_id: `eq.${invoiceId}`,
    limit: "1",
  })
  const response = await supabaseRequest(env, `/rest/v1/member_fee_payments?${params.toString()}`)
  const rows = await readJson<PaymentRow[]>(response, "member fee payment invoice lookup")
  return rows[0] ?? null
}

async function getPaymentByMemberMonth(env: MemberFeeEnv, memberId: number, targetMonth: string) {
  const params = new URLSearchParams({
    select: "member_id,target_month,amount,status,paid_at,square_invoice_id",
    member_id: `eq.${memberId}`,
    target_month: `eq.${targetMonth}`,
    limit: "1",
  })
  const response = await supabaseRequest(env, `/rest/v1/member_fee_payments?${params.toString()}`)
  const rows = await readJson<PaymentRow[]>(response, "member fee payment month lookup")
  return rows[0] ?? null
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

async function unlinkIfDifferentPlan(env: MemberFeeEnv, subscriptionId: string) {
  const billing = await selectBilling(env, "square_subscription_id", subscriptionId)
  if (!billing) return

  await updateBilling(env, billing.id, {
    registration_attempt_token: null,
    square_subscription_id: null,
    square_payment_link_id: null,
    subscription_status: "NOT_REGISTERED",
  })
}

async function processSubscriptionEvent(env: MemberFeeEnv, event: SquareWebhookEvent) {
  const webhookSubscription = event.data?.object?.subscription
  if (!webhookSubscription?.id) {
    throw new Error("Subscription webhook does not contain a subscription ID")
  }

  // Webhookの配送順には依存せず、Square上の現在状態を正として同期する。
  const subscription = await retrieveSubscription(env, webhookSubscription.id)
  if (!subscription?.id || !subscription.customer_id) {
    throw new Error("Current Square subscription does not contain required identifiers")
  }
  if (subscription.plan_variation_id !== env.SQUARE_MEMBER_FEE_PLAN_VARIATION_ID) {
    await unlinkIfDifferentPlan(env, subscription.id)
    return { status: "ignored" as const, detail: "Subscription currently uses another plan variation" }
  }

  const billing = await selectBilling(env, "square_subscription_id", subscription.id)

  if (REREGISTERABLE_STATUSES.has(subscription.status || "")) {
    // 現在このSubscriptionを保持している団員だけ終了状態へ更新する。
    // 再登録後に遅れて届いた旧Subscriptionイベントは無視する。
    if (!billing) {
      return { status: "ignored" as const, detail: "Historical terminal subscription event" }
    }
    await updateBilling(env, billing.id, {
      subscription_status: subscription.status,
      square_payment_link_id: null,
    })
    return { status: "processed" as const }
  }

  if (!billing) {
    // 初回Checkoutではメールアドレスを識別子に使わず、初回Invoice/Paymentの固定noteで紐付ける。
    return { status: "ignored" as const, detail: "Subscription is awaiting immutable checkout linkage" }
  }

  await updateBilling(env, billing.id, {
    square_customer_id: subscription.customer_id,
    square_subscription_id: subscription.id,
    square_payment_link_id: null,
    subscription_status: subscription.status || "UNKNOWN",
    started_at: billing.started_at || subscription.start_date || event.created_at || null,
  })
  return { status: "processed" as const }
}

function paymentRequestForInvoice(invoice: SquareInvoice) {
  return invoice.payment_requests?.[0] ?? null
}

function latestPaymentTimestamp(payments: SquarePayment[]) {
  return payments
    .map((payment) => payment.created_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null
}

function totalRefundedAmount(payments: SquarePayment[]) {
  return payments.reduce((total, payment) => total + (payment.refunded_money?.amount ?? 0), 0)
}

function shouldLinkSubscription(billing: BillingRow, subscriptionId: string) {
  if (!billing.square_subscription_id) return true
  if (billing.square_subscription_id === subscriptionId) return true
  return billing.subscription_status === "NOT_REGISTERED"
    || billing.subscription_status === "PENDING"
    || REREGISTERABLE_STATUSES.has(billing.subscription_status)
}

async function processInvoiceEvent(env: MemberFeeEnv, event: SquareWebhookEvent) {
  const webhookInvoice = event.data?.object?.invoice
  if (!webhookInvoice?.id) {
    return { status: "ignored" as const, detail: "Invoice ID is missing" }
  }

  // Invoiceイベントもpayloadの到着順に依存せず、Square上の現在Invoiceを正として扱う。
  const invoice = await retrieveInvoice(env, webhookInvoice.id)
  if (!invoice?.id || !invoice.subscription_id) {
    return { status: "ignored" as const, detail: "Invoice is not a subscription billing invoice" }
  }

  const existingInvoicePayment = await getPaymentByInvoiceId(env, invoice.id)
  const subscription = await retrieveSubscription(env, invoice.subscription_id)
  if (!subscription) throw new Error("Current Square subscription could not be retrieved")

  const isMemberFeePlan = subscription.plan_variation_id === env.SQUARE_MEMBER_FEE_PLAN_VARIATION_ID
  if (!isMemberFeePlan && !existingInvoicePayment) {
    await unlinkIfDifferentPlan(env, invoice.subscription_id)
    return { status: "ignored" as const, detail: "Invoice belongs to another subscription plan" }
  }

  let billing = existingInvoicePayment
    ? await selectBilling(env, "member_id", String(existingInvoicePayment.member_id))
    : await selectBilling(env, "square_subscription_id", invoice.subscription_id)

  let payments: SquarePayment[] = []
  if (!billing) {
    payments = await retrieveOrderPayments(env, invoice.order_id)
    billing = await findBillingFromPayments(env, payments)
  }

  if (!billing) {
    return { status: "unmatched" as const, detail: `Invoice ${invoice.id} could not be linked to a member` }
  }

  const canLinkSubscription = isMemberFeePlan && shouldLinkSubscription(billing, invoice.subscription_id)
  if (!canLinkSubscription && !existingInvoicePayment && billing.square_subscription_id !== invoice.subscription_id) {
    return { status: "ignored" as const, detail: "Invoice belongs to a historical subscription" }
  }

  const paymentRequest = paymentRequestForInvoice(invoice)
  const dueDate = paymentRequest?.due_date || invoice.sale_or_service_date || event.created_at?.slice(0, 10)
  const targetMonth = firstDayOfMonth(dueDate)
  const computedAmount = paymentRequest?.computed_amount_money?.amount ?? 0
  const completedAmount = paymentRequest?.total_completed_amount_money?.amount ?? 0
  const currency = paymentRequest?.computed_amount_money?.currency
    || paymentRequest?.total_completed_amount_money?.currency
    || "JPY"
  const existingMonthPayment = existingInvoicePayment
    || await getPaymentByMemberMonth(env, billing.member_id, targetMonth)

  if ((invoice.status === "REFUNDED" || invoice.status === "PARTIALLY_REFUNDED") && payments.length === 0) {
    payments = await retrieveOrderPayments(env, invoice.order_id)
  }

  let paymentStatus: "PAID" | "PARTIAL" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED" | null = null
  let amount = completedAmount || computedAmount
  let paidAt = existingMonthPayment?.paid_at ?? null

  if (invoice.status === "REFUNDED" || invoice.status === "PARTIALLY_REFUNDED") {
    const refundedAmount = totalRefundedAmount(payments)
    amount = Math.max(0, completedAmount - refundedAmount)
    paymentStatus = invoice.status === "REFUNDED" || amount === 0 ? "REFUNDED" : "PARTIALLY_REFUNDED"
  } else if (invoice.status === "PAID" || (computedAmount > 0 && completedAmount >= computedAmount)) {
    paymentStatus = "PAID"
    amount = completedAmount || computedAmount
    paidAt = paidAt || latestPaymentTimestamp(payments) || invoice.updated_at || event.created_at || new Date().toISOString()
  } else if (invoice.status === "PARTIALLY_PAID" || completedAmount > 0) {
    paymentStatus = "PARTIAL"
    amount = completedAmount
    paidAt = paidAt || latestPaymentTimestamp(payments) || invoice.updated_at || event.created_at || new Date().toISOString()
  } else if (event.type === "invoice.scheduled_charge_failed") {
    paymentStatus = "FAILED"
    amount = computedAmount
    paidAt = null
  }

  if (!paymentStatus) {
    return { status: "processed" as const, detail: `No ledger change required for invoice status ${invoice.status || "UNKNOWN"}` }
  }

  await upsertPayment(env, {
    member_id: billing.member_id,
    target_month: targetMonth,
    amount,
    currency,
    square_invoice_id: invoice.id,
    status: paymentStatus,
    paid_at: paidAt,
  })

  const billingUpdate: Record<string, unknown> = {
    last_payment_status: paymentStatus,
  }
  if (paymentStatus === "PAID" || paymentStatus === "PARTIAL") {
    billingUpdate.last_payment_at = paidAt
  }
  if (canLinkSubscription) {
    billingUpdate.square_customer_id = subscription.customer_id || invoice.primary_recipient?.customer_id || null
    billingUpdate.square_subscription_id = subscription.id || invoice.subscription_id
    billingUpdate.square_payment_link_id = null
    billingUpdate.subscription_status = subscription.status || billing.subscription_status
    billingUpdate.started_at = billing.started_at || subscription.start_date || event.created_at || null
  }
  await updateBilling(env, billing.id, billingUpdate)

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
    const claimResult = await claimEvent(env, event)
    if (claimResult === "busy") {
      // 2xxを返すとSquareが再送を止めるため、処理中は明示的に再送を継続させる。
      return jsonResponse({ error: "Webhook event is already being processed" }, 503)
    }
    if (claimResult === "completed") {
      return jsonResponse({ ok: true, duplicate: true })
    }
    if (claimResult !== "claimed") {
      throw new Error(`Unknown webhook claim result: ${String(claimResult)}`)
    }

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
