import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedArticles } from '../utils/sanityFetch';
import './FeaturedArticles.scss';

export default function FeaturedArticles() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await getFeaturedArticles();
      if (result) {
        setData(result);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="featured-articles featured-articles-loading">
        <h2 className="home-title">Featured Articles</h2>
        <div className="featured-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <article key={i} className="featured-card">
              <div className="featured-card__image skeleton-pulse" />
              <div className="featured-card__content">
                <div className="featured-card__title skeleton-pulse" style={{ height: '1.2rem', width: '90%', marginBottom: '0.5rem' }} />
                <div className="featured-card__title skeleton-pulse" style={{ height: '1.2rem', width: '70%', marginBottom: '0.8rem' }} />
                <div className="featured-card__date skeleton-pulse" style={{ height: '0.85rem', width: '30%' }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (!data || !data.posts || data.posts.length === 0) return null;

  return (
    <section className="featured-articles">
      <h2 className="home-title">{data.title || 'Featured Articles'}</h2>
      <div className="featured-grid">
        {data.posts.map((post) => (
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
      </div>
    </section>
  );
}
