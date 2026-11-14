import assert from 'node:assert/strict'
import { setTimeout } from 'node:timers/promises'

export async function checkSite(baseUrl, fetcher = fetch, headers = {}) {
  const base = new URL(baseUrl)
  assert.ok(['http:', 'https:'].includes(base.protocol), 'PUBLIC_BASE_URL must use HTTP or HTTPS')
  assert.ok(!base.username && !base.password && !base.search && !base.hash, 'PUBLIC_BASE_URL must not contain credentials or parameters')

  async function request(path, status) {
    const response = await fetcher(new URL(path, base), {
      redirect: 'manual',
      headers,
      signal: AbortSignal.timeout(15_000),
    })
    assert.equal(response.status, status, `${path}: expected HTTP ${status}, received ${response.status}`)
    return response
  }

  for (const path of ['/', '/about', '/member']) {
    const response = await request(path, 200)
    assert.match(response.headers.get('content-type') ?? '', /text\/html/i, `${path}: expected HTML`)
    const html = await response.text()
    assert.match(html, /id=["']root["']/, `${path}: React entry point missing`)
    const asset = html.match(/src=["'](\/assets\/[^"']+\.js)["']/)?.[1]
    assert.ok(asset, `${path}: built JavaScript missing`)
    const script = await request(asset, 200)
    assert.match(script.headers.get('content-type') ?? '', /(?:javascript|ecmascript)/i, 'Asset route returned non-JavaScript')
  }

  for (const path of ['/api/web-members', '/api/web-sitenews?limit=1']) {
    const response = await request(path, 200)
    assert.match(response.headers.get('content-type') ?? '', /application\/json/i, `${path}: expected JSON`)
    assert.ok(Array.isArray(await response.json()), `${path}: expected an array`)
  }

  const preview = await request('/api/draft', 401)
  assert.match(preview.headers.get('cache-control') ?? '', /no-store/i, 'Preview errors must not be cached')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.PUBLIC_BASE_URL) {
    console.error('PUBLIC_BASE_URL is required')
    process.exitCode = 1
  } else {
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const accessId = process.env.CF_ACCESS_CLIENT_ID
        const accessSecret = process.env.CF_ACCESS_CLIENT_SECRET
        assert.equal(Boolean(accessId), Boolean(accessSecret), 'Cloudflare Access requires both service token settings')
        const headers = accessId ? {
          'CF-Access-Client-Id': accessId,
          'CF-Access-Client-Secret': accessSecret,
        } : {}
        await checkSite(process.env.PUBLIC_BASE_URL, fetch, headers)
        console.log('Smoke test passed: pages, assets, public APIs, preview access')
        break
      } catch (error) {
        // Report only assertion messages; fetch errors can include request details.
        console.error(error.code === 'ERR_ASSERTION' ? error.message : 'Smoke request failed')
        if (attempt === 5) process.exitCode = 1
        else await setTimeout(2000)
      }
    }
  }
}
