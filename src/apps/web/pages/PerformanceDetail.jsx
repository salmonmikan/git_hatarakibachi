import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPerformanceBySlug } from '@src/utils/sanityFetch';
import { PortableText } from '@portabletext/react';
import { motion, useReducedMotion } from "motion/react";
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import './PostDetail.scss'; // Reuse post detail styles

export default function PerformanceDetail({ onEntered }) {
  const { slug } = useParams();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    async function fetchPerformance() {
      const data = await getPerformanceBySlug(slug);
      setPerformance(data);
      setLoading(false);
    }
    fetchPerformance();
  }, [slug]);

  if (loading) return <div className="post-detail-loading">読み込み中...</div>;
  if (!performance) return <div className="post-detail-error">公演情報が見つかりませんでした。</div>;

  return (
    <motion.section
      className="page post-detail-page performance-detail-page"
      initial={reduce ? false : "initial"}
      animate="enter"
      exit="exit"
      variants={pageVariants}
      transition={reduce ? { duration: 0 } : pageTransition}
      onAnimationComplete={() => {
          if (typeof onEntered === "function") onEntered();
      }}
    >
      <article className="post-detail performance-detail">
        <header className="post-detail__header">
          <Link to="/" className="post-detail__back">← 戻る</Link>
          <h1 className="post-detail__title">{performance.title}</h1>
          <div className="post-detail__meta">
            {performance.performanceDate && (
              <time className="performance-date" dateTime={performance.performanceDate}>
                開催日：{new Date(performance.performanceDate).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            )}
            {performance.venue && (
              <div className="performance-venue">場所：{performance.venue}</div>
            )}
          </div>
        </header>

        {performance.mainImage && (
          <div className="post-detail__image">
            <img src={performance.mainImage} alt={performance.title} />
          </div>
        )}

        <div className="post-detail__content">
          {performance.cast && (
            <div className="performance-cast" style={{ marginBottom: '2rem' }}>
              <h3>キャスト</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{performance.cast}</p>
            </div>
          )}
          <h3>公演詳細</h3>
          <PortableText value={performance.description} />
        </div>
      </article>
    </motion.section>
  );
}
