import assert from 'node:assert/strict'
import test from 'node:test'
import { checkSite } from '../scripts/smoke.mjs'

const html = '<div id="root"></div><script type="module" src="/assets/app.js"></script>'
function site(overrides = {}) {
  return async (url) => {
    const path = url.pathname + url.search
    if (overrides[path]) return overrides[path]()
    if (path === '/api/draft') return new Response('', { status: 401, headers: { 'cache-control': 'no-store' } })
    if (path.startsWith('/api/')) return new Response('[]', { headers: { 'content-type': 'application/json' } })
    if (path.startsWith('/assets/')) return new Response('', { headers: { 'content-type': 'application/javascript' } })
    return new Response(html, { headers: { 'content-type': 'text/html' } })
  }
}

test('smoke accepts working public pages and APIs', async () => {
  await checkSite('https://example.com', site())
})

test('smoke rejects an authentication redirect', async () => {
  await assert.rejects(checkSite('https://example.com', site({ '/': () => new Response('', { status: 302 }) })))
})

test('smoke rejects SPA fallback on API and JavaScript routes', async () => {
  for (const path of ['/api/web-members', '/assets/app.js']) {
    await assert.rejects(checkSite('https://example.com', site({ [path]: () => new Response(html, { headers: { 'content-type': 'text/html' } }) })))
  }
})

test('smoke rejects missing preview configuration', async () => {
  await assert.rejects(checkSite('https://example.com', site({ '/api/draft': () => new Response('', { status: 503 }) })))
})
