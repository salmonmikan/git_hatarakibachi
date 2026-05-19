import { createClient } from '@sanity/client'
import { canUsePreviewMode } from '@src/utils/previewMode.js'

const PROJECT_ID = 'pz9uficf'
const isStaging =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'staging.hatarakibachi.com' ||
      window.location.hostname === '127.0.0.1'))
const DATASET = isStaging ? 'staging' : 'production'
const API_VERSION = '2023-05-03'
const STUDIO_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3333'
    : 'https://hatarakibachi.sanity.studio'

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  useCdn: true,
  apiVersion: API_VERSION,
})

const previewClient = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  useCdn: false,
  apiVersion: API_VERSION,
  token: import.meta.env.VITE_SANITY_READ_TOKEN,
  perspective: 'previewDrafts',
  stega: {
    enabled: true,
    studioUrl: STUDIO_URL,
  },
})

export async function sanityFetch(query, params = {}) {
  const currentClient = canUsePreviewMode() ? previewClient : client

  try {
    const result = await currentClient.fetch(query, params)
    return result
  } catch (error) {
    console.error('Sanity fetch error:', error)
    return null
  }
}

export async function getFeaturedArticles() {
  const query = `*[_type == "featuredArticles" && _id == "featuredArticles"][0]{
    title,
    performanceDisplayMode,
    posts[]->{
      _id,
      title,
      "slug": slug.current,
      "mainImage": mainImage.asset->url,
      publishedAt
    },
    featuredPerformance[]->{
      _id,
      title,
      "slug": slug.current,
      performanceDate,
      cast,
      venue,
      description,
      displayMode,
      "mainImage": mainImage.asset->url,
      "additionalImages": additionalImages[].asset->url
    },
    sideContentLeft {
      mediaType,
      "imageUrl": image.asset->url,
      "videoUrl": video.asset->url,
      externalUrl
    },
    sideContentRight {
      mediaType,
      "imageUrl": image.asset->url,
      "videoUrl": video.asset->url,
      externalUrl
    }
  }`
  return sanityFetch(query)
}

export async function getPerformanceBySlug(slug) {
  const query = `*[_type == "performance" && slug.current == $slug][0]{
    title,
    specialSiteEnabled,
    "slug": slug.current,
    "mainImage": mainImage.asset->url,
    "additionalImages": additionalImages[].asset->url,
    performanceDate,
    displayMode,
    cast,
    venue,
    description
  }`
  return sanityFetch(query, { slug })
}

export async function getPostBySlug(slug) {
  const query = `*[_type == "post" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    "mainImage": mainImage.asset->url,
    publishedAt,
    body,
    author->{
      name,
      "image": image.asset->url
    },
    categories[]->{
      title
    }
  }`
  return sanityFetch(query, { slug })
}

export async function getNewsBySlug(slug) {
  const query = `*[_type == "news" && slug.current == $slug][0]{
    _id,
    title,
    status,
    "slug": slug.current,
    publishedAt,
    body
  }`
  return sanityFetch(query, { slug })
}

export async function getRecentNews(limit = 5) {
  const query = `*[_type == "news"] | order(coalesce(publishedAt, _updatedAt) desc)[0...$limit]{
    "_id": _id,
    "id": _id,
    title,
    status,
    publishedAt,
    "slug": slug.current
  }`
  return sanityFetch(query, { limit })
}

export async function getNewsStats() {
  const query = `{
    "total": count(*[_type == "news"]),
    "public": count(*[_type == "news" && status == "published"]),
    "private": count(*[_type == "news" && status == "private"])
  }`
  return sanityFetch(query)
}
