export const PREVIEW_COOKIE_NAME = 'sanity-preview'

const ROBOTS_HEADER = 'noindex, nofollow'
const ONE_DAY_SECONDS = 60 * 60 * 24
const SANITY_PREVIEW_PATHNAME_PARAM = 'sanity-preview-pathname'
const PREVIEW_TOKEN_VERSION = '1'

function toBase64Url(value: ArrayBuffer) {
  let binary = ''
  for (const byte of new Uint8Array(value)) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function createPreviewToken(secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(PREVIEW_TOKEN_VERSION),
  )

  return `${PREVIEW_TOKEN_VERSION}.${toBase64Url(signature)}`
}

function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === 'https:'
}

function sameSiteValue(request: Request) {
  return isSecureRequest(request) ? 'None' : 'Lax'
}

function secureAttribute(request: Request) {
  return isSecureRequest(request) ? '; Secure' : ''
}

export async function createPreviewCookie(request: Request, secret: string) {
  const token = await createPreviewToken(secret)
  return `${PREVIEW_COOKIE_NAME}=${token}; Path=/; Max-Age=${ONE_DAY_SECONDS}; SameSite=${sameSiteValue(request)}${secureAttribute(request)}`
}

export function clearPreviewCookie(request: Request) {
  return `${PREVIEW_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=${sameSiteValue(request)}${secureAttribute(request)}`
}

export async function hasPreviewCookie(request: Request, secret?: string) {
  if (!secret) return false

  const cookies = request.headers.get('cookie') ?? ''
  const prefix = `${PREVIEW_COOKIE_NAME}=`
  const token = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length)

  if (!token) return false
  return token === (await createPreviewToken(secret))
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
