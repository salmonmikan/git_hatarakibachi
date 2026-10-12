import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createHmac, hkdfSync } from 'node:crypto'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: ['worker/index.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
})
const worker = (await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'))).default
const previewBundle = await build({
  entryPoints: ['functions/_preview.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
})
const { createPreviewCookie } = await import('data:text/javascript;base64,' + Buffer.from(previewBundle.outputFiles[0].text).toString('base64'))
const readToken = 'synthetic-test-read-token'
const env = {
  SANITY_PREVIEW_READ_TOKEN: readToken,
  ASSETS: { fetch: async () => new Response('asset', { headers: { 'Cache-Control': 'public, max-age=60' } }) },
}

test('ordinary and forged preview requests preserve public asset headers', async () => {
  for (const cookie of ['', 'sanity-preview=1', 'sanity-preview=1.1.invalid']) {
    const response = await worker.fetch(new Request('https://example.test/about', { headers: { cookie } }), env)
    assert.equal(response.headers.get('X-Robots-Tag'), null)
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=60')
  }
})

test('valid signed preview receives private no-store and noindex headers', async () => {
  const request = new Request('https://example.test/about')
  const cookie = (await createPreviewCookie(request, readToken)).split(';')[0]
  const response = await worker.fetch(new Request(request.url, { headers: { cookie } }), env)
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow')
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
})

test('tampered signature and absent signing configuration do not enable preview', async () => {
  const request = new Request('https://example.test/about')
  const cookie = (await createPreviewCookie(request, readToken)).split(';')[0]
  for (const [candidate, config] of [[cookie + 'x', env], [cookie, { ASSETS: env.ASSETS }]]) {
    const response = await worker.fetch(new Request(request.url, { headers: { cookie: candidate } }), config)
    assert.equal(response.headers.get('X-Robots-Tag'), null)
  }
})

test('preview proxy requires POST and rejects unsigned requests before upstream access', async () => {
  const response = await worker.fetch(new Request('https://example.test/api/sanity-preview', { method: 'POST' }), env)
  assert.equal(response.status, 401)
  const get = await worker.fetch(new Request('https://example.test/api/sanity-preview'), env)
  assert.equal(get.status, 405)
  assert.equal(get.headers.get('Allow'), 'POST')
})

test('preview signature matches independent HKDF-SHA256 and HMAC calculation', async () => {
  const request = new Request('https://staging.example.test/about')
  const cookie = (await createPreviewCookie(request, readToken)).split(';')[0]
  const [version, expiry, signature] = cookie.slice('sanity-preview='.length).split('.')
  const key = hkdfSync('sha256', readToken, 'hatarakibachi:preview-cookie:hkdf-sha256:v1', 'preview-cookie:https://staging.example.test', 32)
  const expected = createHmac('sha256', Buffer.from(key)).update(`${version}.${expiry}`).digest('base64url')
  assert.equal(version, '2')
  assert.equal(signature, expected)
  const rawSignature = createHmac('sha256', readToken).update(`${version}.${expiry}`).digest('base64url')
  assert.notEqual(signature, rawSignature)
  const response = await worker.fetch(new Request(request.url, { headers: { cookie: `sanity-preview=${version}.${expiry}.${rawSignature}` } }), env)
  assert.equal(response.headers.get('X-Robots-Tag'), null)
})

test('token rotation and another origin invalidate existing preview cookies', async () => {
  const request = new Request('https://staging.example.test/about')
  const cookie = (await createPreviewCookie(request, readToken)).split(';')[0]
  for (const [url, config] of [
    [request.url, { ...env, SANITY_PREVIEW_READ_TOKEN: 'synthetic-rotated-read-token' }],
    ['https://production.example.test/about', env],
  ]) {
    const response = await worker.fetch(new Request(url, { headers: { cookie } }), config)
    assert.equal(response.headers.get('X-Robots-Tag'), null)
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=60')
  }
})

test('expired and legacy preview cookies are rejected', async (t) => {
  const request = new Request('https://staging.example.test/about')
  const cookie = (await createPreviewCookie(request, readToken)).split(';')[0]
  const legacy = await worker.fetch(new Request(request.url, { headers: { cookie: cookie.replace('sanity-preview=2.', 'sanity-preview=1.') } }), env)
  assert.equal(legacy.headers.get('X-Robots-Tag'), null)
  const now = Date.now()
  t.mock.method(Date, 'now', () => now + 2 * 60 * 60 * 1000)
  for (const candidate of [cookie]) {
    const response = await worker.fetch(new Request(request.url, { headers: { cookie: candidate } }), env)
    assert.equal(response.headers.get('X-Robots-Tag'), null)
  }
})
