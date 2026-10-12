export const PREVIEW_COOKIE_NAME = 'sanity-preview'

const ROBOTS_HEADER = 'noindex, nofollow'
const PREVIEW_SESSION_SECONDS = 60 * 60
const SANITY_PREVIEW_PATHNAME_PARAM = 'sanity-preview-pathname'
const PREVIEW_TOKEN_VERSION = '2'
const PREVIEW_KEY_SALT = 'hatarakibachi:preview-cookie:hkdf-sha256:v1'

function toBase64Url(value: ArrayBuffer) {
  let binary = ''
  for (const byte of new Uint8Array(value)) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000)
}

async function createPreviewToken(request: Request, readToken: string, expiresAt: number) {
  const encoder = new TextEncoder()
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(readToken),
    'HKDF',
    false,
    ['deriveKey'],
  )
  // Bind the signing key to the preview purpose and request origin.
  const key = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(PREVIEW_KEY_SALT),
      info: encoder.encode(`preview-cookie:${new URL(request.url).origin}`),
    },
    material,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${PREVIEW_TOKEN_VERSION}.${expiresAt}`),
  )

  return `${PREVIEW_TOKEN_VERSION}.${expiresAt}.${toBase64Url(signature)}`
}

function getPreviewTokenExpiry(token: string) {
  const [version, expiry, signature, extra] = token.split('.')
  if (version !== PREVIEW_TOKEN_VERSION || !expiry || !signature || extra || !/^\d+$/.test(expiry)) {
    return undefined
  }

  const expiresAt = Number(expiry)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= getCurrentTimestamp()) {
    return undefined
  }

  return expiresAt
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

export async function createPreviewCookie(request: Request, readToken: string) {
  const token = await createPreviewToken(request, readToken, getCurrentTimestamp() + PREVIEW_SESSION_SECONDS)
  return `${PREVIEW_COOKIE_NAME}=${token}; Path=/; Max-Age=${PREVIEW_SESSION_SECONDS}; SameSite=${sameSiteValue(request)}${secureAttribute(request)}`
}

export function clearPreviewCookie(request: Request) {
  return `${PREVIEW_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=${sameSiteValue(request)}${secureAttribute(request)}`
}

export async function hasPreviewCookie(request: Request, readToken?: string) {
  if (!readToken) return false

  const cookies = request.headers.get('cookie') ?? ''
  const prefix = `${PREVIEW_COOKIE_NAME}=`
  const token = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length)

  if (!token) return false

  const expiresAt = getPreviewTokenExpiry(token)
  if (!expiresAt) return false

  return token === (await createPreviewToken(request, readToken, expiresAt))
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
