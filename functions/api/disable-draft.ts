import {
  clearPreviewCookie,
  getSafeRedirect,
  withPreviewHeaders,
} from '../_preview'
import type { FunctionContext } from '../_types'

export const onRequestGet = async ({ request }: Pick<FunctionContext, 'request'>) => {
  const headers = withPreviewHeaders()
  headers.set('Set-Cookie', clearPreviewCookie(request))
  headers.set('Location', getSafeRedirect(request))

  return new Response(null, {
    status: 307,
    headers,
  })
}
