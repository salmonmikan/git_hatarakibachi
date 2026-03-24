import { hasPreviewCookie, withPreviewHeaders } from './_preview'

export const onRequest: PagesFunction = async (context) => {
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
