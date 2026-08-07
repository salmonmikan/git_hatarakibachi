export const PREVIEW_COOKIE_NAME = 'sanity-preview'

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
  return readPreviewCookieValue() === '1'
}

export function canUsePreviewMode() {
  return hasPreviewCookie()
}
