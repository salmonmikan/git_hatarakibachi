import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PortableText } from '@portabletext/react';
import { motion, useReducedMotion } from "motion/react";
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import { getNewsBySlug } from '@src/utils/sanityFetch.js';
import './PostDetail.scss';

export default function NewsDetail({ onEntered }) {
  const { slug } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    async function fetchNews() {
      const data = await getNewsBySlug(slug);
      setNews(data);
      setLoading(false);
    }
    fetchNews();
  }, [slug]);

  if (loading) return <div className="post-detail-loading">読み込み中...</div>;
  if (!news) return <div className="post-detail-error">ニュースが見つかりませんでした。</div>;

  return (
    <motion.section
      className="page post-detail-page news-detail-page"
      initial={reduce ? false : "initial"}
      animate="enter"
      exit="exit"
      variants={pageVariants}
      transition={reduce ? { duration: 0 } : pageTransition}
      onAnimationComplete={() => {
        if (typeof onEntered === "function") onEntered();
      }}
    >
      <article className="post-detail news-detail">
        <header className="post-detail__header">
          <Link
            to="/"
            className="post-detail__back"
            data-gtm-category="navigation"
            data-gtm-action="click"
            data-gtm-label="back_to_home"
            data-gtm-location="news_detail"
            data-gtm-type="internal_link"
            data-gtm-value={slug}
          >← 戻る</Link>
          <h1 className="post-detail__title">{news.title}</h1>
          <div className="post-detail__meta">
            {news.publishedAt && (
              <time dateTime={news.publishedAt}>
                {new Date(news.publishedAt).toLocaleDateString('ja-JP')}
              </time>
            )}
          </div>
        </header>

        <div className="post-detail__content">
          <PortableText value={news.body} />
        </div>
      </article>
    </motion.section>
  );
}
