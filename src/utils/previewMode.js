export const PREVIEW_COOKIE_NAME = 'sanity-preview'
const PREVIEW_TOKEN_PREFIX = '1.'

function readPreviewCookieValue() {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  const prefix = `${PREVIEW_COOKIE_NAME}=`

  for (const cookie of cookies) {
    const value = cookie.trim()
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length)
    }
  }

  return null
}

export function hasPreviewCookie() {
  const value = readPreviewCookieValue()
  return (
    value?.startsWith(PREVIEW_TOKEN_PREFIX) === true && value.length > PREVIEW_TOKEN_PREFIX.length
  )
}

export function canUsePreviewMode() {
  return hasPreviewCookie()
}
