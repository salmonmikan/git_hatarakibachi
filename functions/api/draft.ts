import { createClient } from '@sanity/client'
import { validatePreviewUrl } from '@sanity/preview-url-secret'
import { createPreviewCookie, getSafeRedirect, withPreviewHeaders } from '../_preview'
import type { FunctionContext } from '../_types'

type Env = {
  SANITY_PREVIEW_SECRET?: string
  SANITY_PREVIEW_READ_TOKEN?: string
}

const SANITY_PROJECT_ID = 'pz9uficf'

function getDataset(hostname: string) {
  return hostname === 'staging.hatarakibachi.com' ||
    hostname === '127.0.0.1' ||
    hostname === 'localhost'
    ? 'staging'
    : 'production'
}

export const onRequestGet = async ({ request, env }: FunctionContext<Env>) => {
  if (!env.SANITY_PREVIEW_SECRET || !env.SANITY_PREVIEW_READ_TOKEN) {
    return new Response('Preview service is not configured', {
      status: 503,
      headers: withPreviewHeaders(),
    })
  }

  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: getDataset(new URL(request.url).hostname),
    useCdn: false,
    apiVersion: '2023-05-03',
    token: env.SANITY_PREVIEW_READ_TOKEN,
  })

  let isPreviewUrlValid = false
  try {
    isPreviewUrlValid = (await validatePreviewUrl(client, request.url)).isValid
  } catch {
    isPreviewUrlValid = false
  }

  if (!isPreviewUrlValid) {
    return new Response('Invalid preview secret', {
      status: 401,
      headers: withPreviewHeaders(),
    })
  }

  const headers = withPreviewHeaders()
  headers.set('Set-Cookie', await createPreviewCookie(request, env.SANITY_PREVIEW_SECRET))
  headers.set('Location', getSafeRedirect(request))

  return new Response(null, {
    status: 307,
    headers,
  })
}
