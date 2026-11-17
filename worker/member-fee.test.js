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
  SQUARE_WEBHOOK_SIGNATURE_KEY: 'synthetic-signature-key',
  ASSETS: { fetch: async () => { throw new Error('API must not fall back to assets') } },
}
const post = (path, body, headers = {}) => new Request(base + path, {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
})
const settings = { square_environment: 'sandbox', square_location_id: 'db-location', square_plan_variation_id: 'db-plan' }
const settingsPath = '/rest/v1/member_fee_settings?select=square_environment,square_location_id,square_plan_variation_id&id=eq.1&limit=1'

test('invalid DB settings fail closed before claims despite legacy secrets', async (t) => {
  for (const value of [[], [{ ...settings, square_environment: 'production' }], [{ ...settings, square_environment: 'unknown' }], [{ ...settings, square_location_id: ' ' }], [{ ...settings, square_plan_variation_id: ' ' }], [{ square_environment: 'sandbox', square_location_id: 'db-location' }], null, 'failure', 'missing-worker-environment', 'invalid-worker-environment']) {
    const upstream = t.mock.method(globalThis, 'fetch', async (url) => {
      if (url.endsWith('/rpc/get_member_fee_registration')) return Response.json({ id: 1, member: { name: 'Synthetic', deleted_at: null } })
      assert.equal(url, env.SUPABASE_URL + settingsPath)
      if (value === 'failure') return new Response('unavailable', { status: 500 })
      return Response.json(typeof value === 'string' ? [settings] : value)
    })
    const legacyEnv = { ...env, SQUARE_LOCATION_ID: 'legacy', SQUARE_MEMBER_FEE_PLAN_VARIATION_ID: 'legacy' }
    if (value === 'missing-worker-environment') legacyEnv.SQUARE_ENVIRONMENT = undefined
    if (value === 'invalid-worker-environment') legacyEnv.SQUARE_ENVIRONMENT = 'invalid'
    assert.equal((await worker.fetch(post(registrationPath, { action: 'start', token }), legacyEnv)).status, 503)
    const body = JSON.stringify({ event_id: 'synthetic-event', type: 'subscription.created' })
    const signature = createHmac('sha256', env.SQUARE_WEBHOOK_SIGNATURE_KEY).update(base + webhookPath + body).digest('base64')
    assert.equal((await worker.fetch(post(webhookPath, body, { 'x-square-hmacsha256-signature': signature }), legacyEnv)).status, 503)
    assert.equal(upstream.mock.callCount(), 3)
    upstream.mock.restore()
  }
})

test('signed subscription webhook uses DB plan instead of legacy environment ID', async (t) => {
  const body = JSON.stringify({ event_id: 'db-plan-event', type: 'subscription.updated', data: { object: { subscription: { id: 'subscription-1' } } } })
  const signature = createHmac('sha256', env.SQUARE_WEBHOOK_SIGNATURE_KEY).update(base + webhookPath + body).digest('base64')
  const upstream = t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (url === env.SUPABASE_URL + settingsPath) return Response.json([settings])
    if (url.endsWith('/rpc/claim_square_webhook_event')) return Response.json('claimed')
    if (url === 'https://connect.squareupsandbox.com/v2/subscriptions/subscription-1') {
      return Response.json({ subscription: { id: 'subscription-1', customer_id: 'customer-1', plan_variation_id: settings.square_plan_variation_id, status: 'ACTIVE' } })
    }
    if (url.startsWith(env.SUPABASE_URL + '/rest/v1/member_billing?')) {
      assert.notEqual(init.method, 'PATCH')
      return Response.json([])
    }
    assert.ok(url.startsWith(env.SUPABASE_URL + '/rest/v1/square_webhook_events?'))
    const update = JSON.parse(init.body)
    assert.equal(update.status, 'ignored')
    assert.equal(update.detail, 'Subscription is awaiting immutable checkout linkage')
    return new Response(null, { status: 204 })
  })
  const response = await worker.fetch(post(webhookPath, body, { 'x-square-hmacsha256-signature': signature }), { ...env, SQUARE_MEMBER_FEE_PLAN_VARIATION_ID: 'different-legacy-plan' })
  assert.equal(response.status, 200)
  assert.equal(upstream.mock.callCount(), 5)
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
    if (url === env.SUPABASE_URL + settingsPath) return Response.json([settings])
    if (url.endsWith('/rpc/get_member_fee_registration')) {
      return Response.json({ id: 1, subscription_status: 'NOT_REGISTERED', member: { name: 'Synthetic Member', deleted_at: null } })
    }
    if (url.endsWith('/rpc/claim_member_fee_registration_attempt')) {
      return Response.json({ result: 'claimed', attempt_token: token, billing_email: 'member@example.test' })
    }
    if (url === 'https://connect.squareupsandbox.com/v2/online-checkout/payment-links') {
      const body = JSON.parse(init.body)
      assert.equal(body.idempotency_key, `member-fee-${token}`)
      assert.equal(body.checkout_options.subscription_plan_id, settings.square_plan_variation_id)
      assert.equal(body.quick_pay.location_id, settings.square_location_id)
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
  assert.equal(upstream.mock.callCount(), 5)
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
      if (url === env.SUPABASE_URL + settingsPath) return Response.json([settings])
      assert.equal(url, env.SUPABASE_URL + '/rest/v1/rpc/claim_square_webhook_event')
      assert.deepEqual(JSON.parse(init.body), { p_event_id: 'synthetic-event', p_event_type: 'subscription.created' })
      return Response.json(claim)
    })
    const response = await worker.fetch(post(webhookPath, body, { 'x-square-hmacsha256-signature': signature }), env)
    assert.equal(response.status, status)
    assert.equal(upstream.mock.callCount(), 2)
    upstream.mock.restore()
  }
})
