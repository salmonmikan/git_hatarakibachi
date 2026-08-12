import { hasPreviewCookie, withPreviewHeaders } from './_preview'
import type { MiddlewareContext } from './_types'

type Env = {
  SANITY_PREVIEW_SECRET?: string
}

export const onRequest = async (context: MiddlewareContext<Env>) => {
  const response = await context.next()

  if (!(await hasPreviewCookie(context.request, context.env.SANITY_PREVIEW_SECRET))) {
    return response
  }

  const headers = withPreviewHeaders(new Headers(response.headers))

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
