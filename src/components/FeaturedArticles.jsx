import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedArticles } from '../utils/sanityFetch'
import './FeaturedArticles.scss'

export default function FeaturedArticles() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getFeaturedArticles()
      if (result) {
        setData(result)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const posts = data?.posts ?? []
  const performance = data?.featuredPerformance ?? null

  if (loading) return <div className="featured-articles-loading">Loading...</div>
  if (!data || (posts.length === 0 && !performance)) return null

  return (
    <section className="featured-articles">
      <h2 className="home-title">{data.title || 'Featured Articles'}</h2>
      <div className="featured-grid">
        {posts.map((post) => (
          <Link key={post._id} to={`/post/${post.slug}`} className="featured-card-link">
            <article className="featured-card">
              {post.mainImage && (
                <div className="featured-card__image">
                  <img src={post.mainImage} alt={post.title} />
                </div>
              )}
              <div className="featured-card__content">
                <h3 className="featured-card__title">{post.title}</h3>
                {post.publishedAt && (
                  <time className="featured-card__date" dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                  </time>
                )}
              </div>
            </article>
          </Link>
        ))}
        {performance && (
          <article className="featured-card">
            {performance.mainImage && (
              <div className="featured-card__image">
                <img src={performance.mainImage} alt={performance.title} />
              </div>
            )}
            <div className="featured-card__content">
              <h3 className="featured-card__title">{performance.title}</h3>
              {performance.performanceDate && (
                <time className="featured-card__date" dateTime={performance.performanceDate}>
                  {new Date(performance.performanceDate).toLocaleDateString('ja-JP')}
                </time>
              )}
              {performance.venue && (
                <p className="featured-card__meta">{performance.venue}</p>
              )}
            </div>
          </article>
        )}
      </div>
    </section>
  )
}
