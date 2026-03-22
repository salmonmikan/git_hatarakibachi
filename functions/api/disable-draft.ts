import {
  clearPreviewCookie,
  getSafeRedirect,
  withPreviewHeaders,
} from '../_preview'

export const onRequestGet: PagesFunction = async ({ request }) => {
  const headers = withPreviewHeaders()
  headers.set('Set-Cookie', clearPreviewCookie(request))
  headers.set('Location', getSafeRedirect(request))

  return new Response(null, {
    status: 307,
    headers,
  })
}
