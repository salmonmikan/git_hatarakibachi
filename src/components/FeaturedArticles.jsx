import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { getFeaturedArticles } from '../utils/sanityFetch'
import SideBanner from './SideBanner'
import './FeaturedArticles.scss'

let featuredArticlesPromise

function loadFeaturedArticles() {
  if (!featuredArticlesPromise) {
    featuredArticlesPromise = getFeaturedArticles()
  }
  return featuredArticlesPromise
}

function preloadImage(url) {
  if (!url || typeof document === 'undefined') return
  if (document.head.querySelector(`link[rel="preload"][href="${url}"]`)) return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = url
  document.head.appendChild(link)
}

function getPriorityImageUrl(result) {
  if (!result) return null
  if (result.performanceDisplayMode === 'carousel') {
    return result.featuredPerformance?.[0]?.mainImage ?? result.posts?.[0]?.mainImage ?? null
  }
  return result.posts?.[0]?.mainImage ?? result.featuredPerformance?.[0]?.mainImage ?? null
}

export default function FeaturedArticles() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    let alive = true

    loadFeaturedArticles().then((result) => {
      if (!alive) return
      if (result) {
        preloadImage(getPriorityImageUrl(result))
        setData(result)
      }
      setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [])

  const posts = data?.posts ?? []
  const performances = data?.featuredPerformance ?? []
  const mode = data?.performanceDisplayMode ?? 'grid'
  const gridItems = [...posts, ...performances]

  if (loading) return <div className="featured-articles-loading">Loading...</div>
  if (!data || (posts.length === 0 && performances.length === 0)) return null

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? performances.length - 1 : prev - 1))
  }
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === performances.length - 1 ? 0 : prev + 1))
  }

  const renderCard = (m, type, priority = false) => {
    const isPost = type === 'post'
    const link = isPost ? `/post/${m.slug}` : `/performance/${m.slug}`
    const date = isPost ? m.publishedAt : m.performanceDate
    const showMeta = isPost || m.displayMode !== 'imageOnly'
    const analyticsProps = {
      'data-gtm-category': 'content',
      'data-gtm-action': 'click',
      'data-gtm-label': isPost ? 'featured_post' : 'featured_performance',
      'data-gtm-location': 'home',
      'data-gtm-type': isPost ? 'post_card' : 'performance_card',
      'data-gtm-value': m.slug,
    }

    return (
      <Link
        key={m._id}
        to={link}
        className="featured-card-link"
        {...analyticsProps}
      >
        <article className={`featured-card ${!isPost && m.displayMode === 'imageOnly' ? 'is-image-only' : ''}`} {...analyticsProps}>
          {m.mainImage && (
            <div className="featured-card__image" {...analyticsProps}>
              <img
                src={m.mainImage}
                alt={m.title}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                {...analyticsProps}
              />
            </div>
          )}
          {showMeta && (
            <div className="featured-card__content" {...analyticsProps}>
              <h3 className="featured-card__title" {...analyticsProps}>{m.title}</h3>
              {date && (
                <time className="featured-card__date" dateTime={date} {...analyticsProps}>
                  {new Date(date).toLocaleDateString('ja-JP')}
                </time>
              )}
              {!isPost && m.venue && (
                <p className="featured-card__meta" {...analyticsProps}>{m.venue}</p>
              )}
            </div>
          )}
        </article>
      </Link>
    )
  }

  return (
    <>
      <SideBanner side="left" content={data.sideContentLeft} />
      <SideBanner side="right" content={data.sideContentRight} />
      <section className="featured-articles">
        <h2 className="home-title">{data.title || 'Featured Articles'}</h2>

        {mode === 'carousel' && performances.length > 0 ? (
          <div className="featured-carousel-container">
            <div className="featured-carousel">
              <AnimatePresence mode="wait">
                <motion.div
                  key={performances[currentIndex]._id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="carousel-slide"
                >
                  {renderCard(performances[currentIndex], 'performance', currentIndex === 0)}
                </motion.div>
              </AnimatePresence>
              
              {performances.length > 1 && (
                <>
                  <button className="carousel-nav-btn prev" onClick={handlePrev} aria-label="前の公演へ">
                    &lt;
                  </button>
                  <button className="carousel-nav-btn next" onClick={handleNext} aria-label="次の公演へ">
                    &gt;
                  </button>
                  <div className="carousel-dots">
                    {performances.map((_, idx) => (
                      <button
                        key={idx}
                        className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(idx)}
                        data-gtm-category="engagement"
                        data-gtm-action="select"
                        data-gtm-label="carousel"
                        data-gtm-location="home"
                        data-gtm-type="featured_performance"
                        data-gtm-value={String(idx + 1)}
                        aria-label={`${idx + 1}枚目のスライドへ`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {posts.length > 0 && (
              <div className="featured-grid secondary-grid">
                {posts.map((post) => renderCard(post, 'post'))}
              </div>
            )}
          </div>
        ) : (
          <div className={`featured-grid ${gridItems.length === 1 ? 'is-single' : ''}`}>
            {gridItems.map((item, index) => {
              const isPost = posts.some(p => p._id === item._id)
              return renderCard(item, isPost ? 'post' : 'performance', index === 0)
            })}
          </div>
        )}
      </section>
    </>
  )
}
