import { hasPreviewCookie, withPreviewHeaders } from './_preview'
import type { MiddlewareContext } from './_types'

export const onRequest = async (context: MiddlewareContext) => {
  const response = await context.next()

  if (!hasPreviewCookie(context.request)) {
    return response
  }

  const headers = withPreviewHeaders(new Headers(response.headers))

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
