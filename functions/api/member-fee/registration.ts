import type { FunctionContext } from "../../_types"
import {
  MEMBER_FEE_AMOUNT,
  MEMBER_FEE_CURRENCY,
  isValidEmail,
  jsonResponse,
  normalizeEmail,
  readJson,
  squareRequest,
  supabaseRequest,
  type MemberFeeEnv,
} from "../../_memberFee"

type BillingRow = {
  id: number
  member_id: number
  billing_email: string | null
  registration_token: string
  registration_attempt_token: string | null
  square_subscription_id: string | null
  square_payment_link_id: string | null
  subscription_status: string
  member: {
    id: number
    name: string
    deleted_at: string | null
  } | null
}

type PaymentLinkResponse = {
  payment_link?: {
    id?: string
    url?: string
  }
}

type RegistrationAttemptClaim = {
  result?: "claimed" | "pending" | "registered" | "email_conflict" | "invalid_email" | "not_found"
  attempt_token?: string | null
  billing_email?: string | null
  payment_link_id?: string | null
  subscription_status?: string | null
}

const REREGISTERABLE_STATUSES = new Set(["CANCELED", "COMPLETED"])
const PAYMENT_NOTE_PREFIX = "hatarakibachi-member-fee:"

function registrationParams(token: string) {
  const params = new URLSearchParams({
    select: "id,member_id,billing_email,registration_token,registration_attempt_token,square_subscription_id,square_payment_link_id,subscription_status,member:members(id,name,deleted_at)",
    registration_token: `eq.${token}`,
    limit: "1",
  })
  return params.toString()
}

async function getBillingByToken(env: MemberFeeEnv, token: string) {
  const response = await supabaseRequest(
    env,
    `/rest/v1/member_billing?${registrationParams(token)}`,
  )
  const rows = await readJson<BillingRow[]>(response, "member billing lookup")
  return rows[0] ?? null
}

function validateAvailableBilling(row: BillingRow | null) {
  if (!row || !row.member || row.member.deleted_at) {
    return jsonResponse({ error: "この登録リンクは利用できません。" }, 404)
  }
  return null
}

function isRegistered(row: BillingRow) {
  return Boolean(row.square_subscription_id) && !REREGISTERABLE_STATUSES.has(row.subscription_status)
}

async function retrievePaymentLink(env: MemberFeeEnv, paymentLinkId: string) {
  const response = await squareRequest(
    env,
    `/v2/online-checkout/payment-links/${encodeURIComponent(paymentLinkId)}`,
  )
  const body = await readJson<PaymentLinkResponse>(response, "Square payment link retrieval")
  return body.payment_link?.url ?? null
}

async function claimRegistrationAttempt(env: MemberFeeEnv, billingId: number, email: string | null) {
  const response = await supabaseRequest(
    env,
    "/rest/v1/rpc/claim_member_fee_registration_attempt",
    {
      method: "POST",
      body: JSON.stringify({
        p_billing_id: billingId,
        p_email: email,
      }),
    },
  )
  return readJson<RegistrationAttemptClaim>(response, "member fee registration attempt claim")
}

export const onRequestGet = async ({ request, env }: FunctionContext<MemberFeeEnv>) => {
  try {
    const token = new URL(request.url).searchParams.get("token")?.trim() ?? ""
    if (!token) return jsonResponse({ error: "登録トークンがありません。" }, 400)

    const row = await getBillingByToken(env, token)
    const invalid = validateAvailableBilling(row)
    if (invalid) return invalid

    return jsonResponse({
      memberName: row!.member!.name,
      status: row!.subscription_status,
      registered: isRegistered(row!),
      pending: row!.subscription_status === "PENDING" && Boolean(row!.registration_attempt_token),
    })
  } catch (error) {
    console.error("member fee registration lookup failed", error)
    return jsonResponse({ error: "登録情報を確認できませんでした。" }, 500)
  }
}

export const onRequestPost = async ({ request, env }: FunctionContext<MemberFeeEnv>) => {
  try {
    if (!env.SQUARE_ACCESS_TOKEN || !env.SQUARE_LOCATION_ID || !env.SQUARE_MEMBER_FEE_PLAN_VARIATION_ID) {
      return jsonResponse({ error: "団員費の決済設定が完了していません。" }, 503)
    }

    const body = await request.json().catch(() => null) as { token?: unknown; email?: unknown } | null
    const token = typeof body?.token === "string" ? body.token.trim() : ""
    const email = normalizeEmail(body?.email)

    if (!token) return jsonResponse({ error: "登録トークンがありません。" }, 400)
    if (email && !isValidEmail(email)) return jsonResponse({ error: "メールアドレスを確認してください。" }, 400)

    const row = await getBillingByToken(env, token)
    const invalid = validateAvailableBilling(row)
    if (invalid) return invalid

    // DB行ロック内でPENDING化してattemptを確保する。
    // 同時POSTは同じattemptを受け取るため、Square側でも同じidempotency keyへ収束する。
    const claim = await claimRegistrationAttempt(env, row!.id, email)

    if (claim.result === "not_found") {
      return jsonResponse({ error: "この登録リンクは利用できません。" }, 404)
    }
    if (claim.result === "invalid_email") {
      return jsonResponse({ error: "メールアドレスを確認してください。" }, 400)
    }
    if (claim.result === "email_conflict") {
      return jsonResponse({ error: "このメールアドレスは別の団員に登録済みです。" }, 409)
    }
    if (claim.result === "registered") {
      const message = claim.subscription_status === "DEACTIVATED"
        ? "この定期決済はSquare側で無効化されています。劇団運営へ再開をご相談ください。"
        : "この団員はすでに団員費の定期決済へ登録されています。"
      return jsonResponse({ error: message }, 409)
    }
    if (claim.result !== "claimed" && claim.result !== "pending") {
      throw new Error(`Unexpected registration claim result: ${String(claim.result)}`)
    }

    const attemptToken = claim.attempt_token?.trim() ?? ""
    const claimedEmail = normalizeEmail(claim.billing_email)
    if (!attemptToken || !isValidEmail(claimedEmail)) {
      throw new Error("Registration attempt claim is incomplete")
    }

    if (claim.payment_link_id) {
      const existingUrl = await retrievePaymentLink(env, claim.payment_link_id)
      if (!existingUrl) throw new Error("Existing Square payment link is unavailable")
      return jsonResponse({ url: existingUrl, existing: true })
    }

    const origin = new URL(request.url).origin
    const squareResponse = await squareRequest(env, "/v2/online-checkout/payment-links", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: `member-fee-${attemptToken}`,
        description: "劇団はたらきばち 団員費",
        payment_note: `${PAYMENT_NOTE_PREFIX}${attemptToken}`,
        quick_pay: {
          name: "劇団はたらきばち 団員費",
          price_money: {
            amount: MEMBER_FEE_AMOUNT,
            currency: MEMBER_FEE_CURRENCY,
          },
          location_id: env.SQUARE_LOCATION_ID,
        },
        checkout_options: {
          subscription_plan_id: env.SQUARE_MEMBER_FEE_PLAN_VARIATION_ID,
          redirect_url: `${origin}/member-fee/complete`,
        },
        pre_populated_data: {
          buyer_email: claimedEmail,
        },
      }),
    })
    const squareBody = await readJson<PaymentLinkResponse>(squareResponse, "Square payment link creation")
    const paymentLinkId = squareBody.payment_link?.id
    const paymentLinkUrl = squareBody.payment_link?.url
    if (!paymentLinkId || !paymentLinkUrl) {
      throw new Error("Square payment link response is incomplete")
    }

    // attempt tokenを条件にして、現在のclaimにだけPayment Link IDを保存する。
    // DB更新に失敗しても次回POSTは同じattempt/idempotency keyでSquare応答を復元できる。
    const updateParams = new URLSearchParams({
      id: `eq.${row!.id}`,
      registration_attempt_token: `eq.${attemptToken}`,
      subscription_status: "eq.PENDING",
    })
    const updateResponse = await supabaseRequest(
      env,
      `/rest/v1/member_billing?${updateParams.toString()}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          square_payment_link_id: paymentLinkId,
          updated_at: new Date().toISOString(),
        }),
      },
    )
    if (!updateResponse.ok) {
      await readJson(updateResponse, "member billing payment link update")
    }

    return jsonResponse({ url: paymentLinkUrl })
  } catch (error) {
    console.error("member fee registration failed", error)
    return jsonResponse({ error: "決済ページを作成できませんでした。管理者へお問い合わせください。" }, 500)
  }
}
