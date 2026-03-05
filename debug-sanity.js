const PROJECT_ID = 'pz9uficf';
const DATASET = 'production';
const QUERY = encodeURIComponent(`*[_type == "featuredArticles" && _id == "featuredArticles"][0]{
    title,
    posts[]->{
      _id,
      title,
      "slug": slug.current,
      "mainImage": mainImage.asset->url,
      publishedAt
    }
  }`);
const url = `https://${PROJECT_ID}.api.sanity.io/v2023-05-03/data/query/${DATASET}?query=${QUERY}`;

fetch(url)
  .then(res => res.json())
  .then(json => {
    console.log('--- Sanity Debug ---');
    console.log('URL:', url);
    console.log('Result:', JSON.stringify(json, null, 2));
  })
  .catch(err => console.error('Fetch Error:', err));
