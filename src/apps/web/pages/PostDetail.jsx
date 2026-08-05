import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostBySlug } from '@src/utils/sanityFetch';
import { PortableText } from '@portabletext/react';
import { motion, useReducedMotion } from "motion/react";
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import './PostDetail.scss';

export default function PostDetail({ onEntered }) {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    async function fetchPost() {
      const data = await getPostBySlug(slug);
      setPost(data);
      setLoading(false);
    }
    fetchPost();
  }, [slug]);

  if (loading) return <div className="post-detail-loading">読み込み中...</div>;
  if (!post) return <div className="post-detail-error">記事が見つかりませんでした。</div>;

  return (
    <motion.section
      className="page post-detail-page"
      initial={reduce ? false : "initial"}
      animate="enter"
      exit="exit"
      variants={pageVariants}
      transition={reduce ? { duration: 0 } : pageTransition}
      onAnimationComplete={() => {
          if (typeof onEntered === "function") onEntered();
      }}
    >
      <article className="post-detail">
        <header className="post-detail__header">
          <Link
            to="/"
            className="post-detail__back"
            data-gtm-category="navigation"
            data-gtm-action="click"
            data-gtm-label="back_to_home"
            data-gtm-location="post_detail"
            data-gtm-type="internal_link"
            data-gtm-value={slug}
          >← 戻る</Link>
          <h1 className="post-detail__title">{post.title}</h1>
          <div className="post-detail__meta">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
              </time>
            )}
            {post.author && (
              <span className="post-detail__author">by {post.author.name}</span>
            )}
          </div>
        </header>

        {post.mainImage && (
          <div className="post-detail__image">
            <img src={post.mainImage} alt={post.title} />
          </div>
        )}

        <div className="post-detail__content">
          <PortableText value={post.body} />
        </div>

        {post.categories && post.categories.length > 0 && (
          <footer className="post-detail__footer">
            <div className="post-detail__categories">
              {post.categories.map((cat, i) => (
                <span key={i} className="post-tag">{cat.title}</span>
              ))}
            </div>
          </footer>
        )}
      </article>
    </motion.section>
  );
}
