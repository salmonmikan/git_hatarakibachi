import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
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
const signingKey = 'synthetic-test-signing-key'
const env = {
  SANITY_PREVIEW_SECRET: signingKey,
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
  const cookie = (await createPreviewCookie(request, signingKey)).split(';')[0]
  const response = await worker.fetch(new Request(request.url, { headers: { cookie } }), env)
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow')
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
})

test('tampered signature and absent signing configuration do not enable preview', async () => {
  const request = new Request('https://example.test/about')
  const cookie = (await createPreviewCookie(request, signingKey)).split(';')[0]
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
