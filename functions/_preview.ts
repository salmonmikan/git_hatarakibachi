export const PREVIEW_COOKIE_NAME = 'sanity-preview'

const ROBOTS_HEADER = 'noindex, nofollow'
const ONE_DAY_SECONDS = 60 * 60 * 24
const SANITY_PREVIEW_PATHNAME_PARAM = 'sanity-preview-pathname'

function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === 'https:'
}

function sameSiteValue(request: Request) {
  return isSecureRequest(request) ? 'None' : 'Lax'
}

function secureAttribute(request: Request) {
  return isSecureRequest(request) ? '; Secure' : ''
}

export function createPreviewCookie(request: Request) {
  return `${PREVIEW_COOKIE_NAME}=1; Path=/; Max-Age=${ONE_DAY_SECONDS}; SameSite=${sameSiteValue(request)}${secureAttribute(request)}`
}

export function clearPreviewCookie(request: Request) {
  return `${PREVIEW_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=${sameSiteValue(request)}${secureAttribute(request)}`
}

export function hasPreviewCookie(request: Request) {
  const cookies = request.headers.get('cookie') ?? ''
  return cookies.split(';').some((cookie) => cookie.trim() === `${PREVIEW_COOKIE_NAME}=1`)
}

export function getSafeRedirect(request: Request, fallback = '/') {
  const url = new URL(request.url)
  const redirect =
    url.searchParams.get('redirect') ??
    url.searchParams.get('url') ??
    url.searchParams.get(SANITY_PREVIEW_PATHNAME_PARAM) ??
    fallback

  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return fallback
  }

  return redirect
}

export function withPreviewHeaders(headers = new Headers()) {
  headers.set('Cache-Control', 'private, no-store')
  headers.set('X-Robots-Tag', ROBOTS_HEADER)
  return headers
}
