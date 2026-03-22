import { createClient } from '@sanity/client'
import { canUsePreviewMode } from '@src/utils/previewMode.js'

const PROJECT_ID = 'pz9uficf'
const DATASET = 'production'
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
    posts[]->{
      _id,
      title,
      "slug": slug.current,
      "mainImage": mainImage.asset->url,
      publishedAt
    },
    featuredPerformance->{
      _id,
      title,
      performanceDate,
      cast,
      venue,
      description,
      "mainImage": mainImage.asset->url
    }
  }`
  return sanityFetch(query)
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