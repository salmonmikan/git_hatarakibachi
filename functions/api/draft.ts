import {
  createPreviewCookie,
  getSafeRedirect,
  withPreviewHeaders,
} from '../_preview'

type Env = {
  SANITY_PREVIEW_SECRET?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')

  if (!env.SANITY_PREVIEW_SECRET || secret !== env.SANITY_PREVIEW_SECRET) {
    return new Response('Invalid preview secret', {
      status: 401,
      headers: withPreviewHeaders(),
    })
  }

  const headers = withPreviewHeaders()
  headers.set('Set-Cookie', createPreviewCookie(request))
  headers.set('Location', getSafeRedirect(request))

  return new Response(null, {
    status: 307,
    headers,
  })
}
