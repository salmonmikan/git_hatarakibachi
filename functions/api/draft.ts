import { createPreviewCookie, getSafeRedirect, withPreviewHeaders } from '../_preview'
import type { FunctionContext } from '../_types'

type Env = {
  SANITY_PREVIEW_SECRET?: string
}

export const onRequestGet = async ({ request, env }: FunctionContext<Env>) => {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')

  if (!env.SANITY_PREVIEW_SECRET || secret !== env.SANITY_PREVIEW_SECRET) {
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
