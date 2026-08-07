import { createClient } from '@sanity/client'
import { hasPreviewCookie, withPreviewHeaders } from '../_preview'
import type { FunctionContext } from '../_types'

type Env = {
  SANITY_PREVIEW_SECRET?: string
  SANITY_PREVIEW_READ_TOKEN?: string
}

type PreviewRequest = {
  query?: unknown
  params?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getDataset(hostname: string) {
  return hostname === 'staging.hatarakibachi.com' ||
    hostname === '127.0.0.1' ||
    hostname === 'localhost'
    ? 'staging'
    : 'production'
}

export const onRequestPost = async ({ request, env }: FunctionContext<Env>) => {
  if (!(await hasPreviewCookie(request, env.SANITY_PREVIEW_SECRET))) {
    return new Response('Preview mode is not enabled', {
      status: 401,
      headers: withPreviewHeaders(),
    })
  }

  if (!env.SANITY_PREVIEW_READ_TOKEN) {
    return new Response('Preview service is not configured', {
      status: 503,
      headers: withPreviewHeaders(),
    })
  }

  const body = (await request.json().catch(() => null)) as PreviewRequest | null
  if (typeof body?.query !== 'string' || !isRecord(body.params)) {
    return new Response('Invalid preview request', {
      status: 400,
      headers: withPreviewHeaders(),
    })
  }

  const client = createClient({
    projectId: 'pz9uficf',
    dataset: getDataset(new URL(request.url).hostname),
    useCdn: false,
    apiVersion: '2023-05-03',
    token: env.SANITY_PREVIEW_READ_TOKEN,
    perspective: 'previewDrafts',
    stega: {
      enabled: true,
      studioUrl: 'https://hatarakibachi.sanity.studio',
    },
  })

  try {
    const result = await client.fetch(body.query, body.params)
    const headers = withPreviewHeaders()
    headers.set('content-type', 'application/json; charset=utf-8')

    return new Response(JSON.stringify(result), {
      status: 200,
      headers,
    })
  } catch {
    return new Response('Preview fetch failed', {
      status: 502,
      headers: withPreviewHeaders(),
    })
  }
}
