const PROJECT_ID = 'pz9uficf';
const DATASET = 'production';
const API_VERSION = '2023-05-03';

export async function sanityFetch(query) {
  const encodeQuery = encodeURIComponent(query);
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeQuery}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Sanity fetch failed: ${response.statusText}`);
    }
    const { result } = await response.json();
    return result;
  } catch (error) {
    console.error('Sanity fetch error:', error);
    return null;
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
  // sanityFetch を拡張してパラメータを渡せるようにするか、
  // ここで直接 fetch を呼ぶようにします。
  const encodeQuery = encodeURIComponent(query);
  const encodeParams = encodeURIComponent(JSON.stringify({ slug }));
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeQuery}&$slug=%22${slug}%22`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Sanity fetch failed: ${response.statusText}`);
    }
    const { result } = await response.json();
    return result;
  } catch (error) {
    console.error('Sanity fetch error:', error);
    return null;
  }
}
