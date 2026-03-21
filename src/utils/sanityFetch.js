import { createClient } from '@sanity/client';

const PROJECT_ID = 'pz9uficf';
const DATASET = 'production';
const API_VERSION = '2023-05-03';

// 通常のクライアント（公開データのみ）
const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  useCdn: true,
  apiVersion: API_VERSION,
  stega: {
    enabled: true,
    studioUrl: 'http://localhost:3333', // Sanity Studio の URL
  },
});

// プレビュー用クライアント（トークンが必要、キャッシュ無効）
const previewClient = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  useCdn: false,
  apiVersion: API_VERSION,
  token: import.meta.env.VITE_SANITY_READ_TOKEN, // プレビュー用トークン
  perspective: 'previewDrafts',
});

// プレビューモードかどうかを判定する関数（例えばURLパラメーターや環境変数などで制御）
const isPreviewMode = () => {
  // window.location が存在する場合（ブラウザ環境）に URL をチェック
  if (typeof window !== 'undefined') {
    return window.location.search.includes('preview=true') || window.location.hostname === 'localhost';
  }
  return false;
};

export async function sanityFetch(query, params = {}) {
  const currentClient = isPreviewMode() && import.meta.env.VITE_SANITY_READ_TOKEN ? previewClient : client;

  try {
    const result = await currentClient.fetch(query, params);
    return result;
  } catch (error) {
    console.error('Sanity fetch error:', error);
    return null;
  }
}

export async function getFeaturedArticles() {
  const query = `*[_type == "featuredArticles" && _id == "featuredArticles"][0]{
    title,
    featuredPerformance->{
      _id,
      title,
      performanceDate,
      cast,
      venue,
      description,
      "mainImage": mainImage.asset->url
    }
  }`;
  return sanityFetch(query);
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
  }`;
  return sanityFetch(query, { slug });
}
