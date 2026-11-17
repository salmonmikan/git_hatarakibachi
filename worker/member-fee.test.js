import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['worker/index.ts'], bundle: true, write: false, format: 'esm', platform: 'browser' })
const worker = (await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'))).default
const base = 'https://staging.example.test'
const registrationPath = '/api/member-fee/registration'
const webhookPath = '/api/square/webhook'
const token = '11111111-1111-4111-8111-111111111111'
const env = {
  SUPABASE_URL: 'https://database.example.test',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key',
  SQUARE_ENVIRONMENT: 'sandbox',
  SQUARE_ACCESS_TOKEN: 'synthetic-access-token',
  SQUARE_LOCATION_ID: 'synthetic-location',
  SQUARE_MEMBER_FEE_PLAN_VARIATION_ID: 'synthetic-plan',
  SQUARE_WEBHOOK_SIGNATURE_KEY: 'synthetic-signature-key',
  ASSETS: { fetch: async () => { throw new Error('API must not fall back to assets') } },
}
const post = (path, body, headers = {}) => new Request(base + path, {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
})

test('member fee endpoints reject non-POST methods before upstream access', async (t) => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected upstream') })
  for (const path of [registrationPath, webhookPath]) {
    for (const method of ['GET', 'HEAD', 'PUT', 'DELETE']) {
      const response = await worker.fetch(new Request(base + path, { method }), env)
      assert.equal(response.status, 405)
      assert.equal(response.headers.get('Allow'), 'POST')
    }
  }
})

test('registration rejects invalid and oversized input before upstream access', async (t) => {
  const upstream = t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected upstream') })
  for (const [body, status] of [['{', 400], [{ action: 'lookup', token: 'invalid' }, 400], ['x'.repeat(8193), 413]]) {
    const response = await worker.fetch(post(registrationPath, body), env)
    assert.equal(response.status, status)
  }
  assert.equal(upstream.mock.callCount(), 0)
})

test('lookup uses server-only RPC body and returns only registration summary', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, env.SUPABASE_URL + '/rest/v1/rpc/get_member_fee_registration')
    assert.equal(init.method, 'POST')
    assert.deepEqual(JSON.parse(init.body), { p_token: token })
    return Response.json({ id: 1, member_id: 1, registration_token: token, subscription_status: 'NOT_REGISTERED', member: { id: 1, name: 'Synthetic Member', deleted_at: null } })
  })
  const response = await worker.fetch(post(registrationPath, { action: 'lookup', token }), env)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { memberName: 'Synthetic Member', status: 'NOT_REGISTERED', registered: false, pending: false })
})

test('registration remains unavailable until Square setup is supplied', async (t) => {
  const upstream = t.mock.method(globalThis, 'fetch', async () => Response.json({ id: 1, subscription_status: 'NOT_REGISTERED', member: { name: 'Synthetic Member', deleted_at: null } }))
  const response = await worker.fetch(post(registrationPath, { action: 'start', token, email: 'member@example.test' }), { ...env, SQUARE_ACCESS_TOKEN: undefined })
  assert.equal(response.status, 503)
  assert.equal(upstream.mock.callCount(), 1)
})

test('registration creates a Sandbox checkout with an atomic attempt and canonical completion URL', async (t) => {
  const upstream = t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (url.endsWith('/rpc/get_member_fee_registration')) {
      return Response.json({ id: 1, subscription_status: 'NOT_REGISTERED', member: { name: 'Synthetic Member', deleted_at: null } })
    }
    if (url.endsWith('/rpc/claim_member_fee_registration_attempt')) {
      return Response.json({ result: 'claimed', attempt_token: token, billing_email: 'member@example.test' })
    }
    if (url === 'https://connect.squareupsandbox.com/v2/online-checkout/payment-links') {
      const body = JSON.parse(init.body)
      assert.equal(body.idempotency_key, `member-fee-${token}`)
      assert.equal(body.checkout_options.subscription_plan_id, env.SQUARE_MEMBER_FEE_PLAN_VARIATION_ID)
      assert.equal(body.checkout_options.redirect_url, base + '/member-fee/complete')
      assert.deepEqual(body.quick_pay.price_money, { amount: 1000, currency: 'JPY' })
      return Response.json({ payment_link: { id: 'synthetic-link', url: 'https://checkout.example.test' } })
    }
    assert.equal(new URL(url).origin, env.SUPABASE_URL)
    assert.equal(init.method, 'PATCH')
    return new Response(null, { status: 204 })
  })
  const response = await worker.fetch(post(registrationPath, { action: 'start', token, email: 'member@example.test' }), env)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { url: 'https://checkout.example.test' })
  assert.equal(upstream.mock.callCount(), 4)
})

test('webhook rejects invalid signatures and oversized bodies without upstream access', async (t) => {
  const upstream = t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected upstream') })
  assert.equal((await worker.fetch(post(webhookPath, {}), env)).status, 403)
  assert.equal((await worker.fetch(post(webhookPath, 'x'.repeat(262145)), env)).status, 413)
  assert.equal(upstream.mock.callCount(), 0)
})

test('signed webhook retries busy events and acknowledges completed duplicates', async (t) => {
  const body = JSON.stringify({ event_id: 'synthetic-event', type: 'subscription.created' })
  const signature = createHmac('sha256', env.SQUARE_WEBHOOK_SIGNATURE_KEY).update(base + webhookPath + body).digest('base64')
  for (const [claim, status] of [['busy', 503], ['completed', 200]]) {
    const upstream = t.mock.method(globalThis, 'fetch', async (url, init) => {
      assert.equal(url, env.SUPABASE_URL + '/rest/v1/rpc/claim_square_webhook_event')
      assert.deepEqual(JSON.parse(init.body), { p_event_id: 'synthetic-event', p_event_type: 'subscription.created' })
      return Response.json(claim)
    })
    const response = await worker.fetch(post(webhookPath, body, { 'x-square-hmacsha256-signature': signature }), env)
    assert.equal(response.status, status)
    assert.equal(upstream.mock.callCount(), 1)
    upstream.mock.restore()
  }
})
