function canTransformSanityImage(url) {
  return typeof url === 'string' && url.includes('.sanity.io/images/')
}

export function buildSanityImageUrl(url, params = {}) {
  if (!canTransformSanityImage(url)) return url

  const nextUrl = new URL(url)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      nextUrl.searchParams.set(key, String(value))
    }
  })
  return nextUrl.toString()
}

export function getPerformanceCardImageUrl(url) {
  return buildSanityImageUrl(url, {
    w: 900,
    h: 720,
    fit: 'crop',
    auto: 'format',
  })
}

export function getPerformanceDetailImageUrl(url) {
  return buildSanityImageUrl(url, {
    w: 1400,
    h: 1120,
    fit: 'crop',
    auto: 'format',
  })
}

export function getPerformanceGalleryImageUrl(url) {
  return buildSanityImageUrl(url, {
    w: 900,
    h: 720,
    fit: 'crop',
    auto: 'format',
  })
}

export function getPerformanceLightboxImageUrl(url) {
  return buildSanityImageUrl(url, {
    w: 1800,
    auto: 'format',
  })
}

export function getPerformanceCastPhotoUrl(url) {
  return buildSanityImageUrl(url, {
    w: 560,
    h: 700,
    fit: 'crop',
    auto: 'format',
  })
}
