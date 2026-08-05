import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPerformanceBySlug } from '@src/utils/sanityFetch';
import { PortableText } from '@portabletext/react';
import { motion, useReducedMotion } from "motion/react";
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import {
  getPerformanceCastPhotoUrl,
  getPerformanceDetailImageUrl,
  getPerformanceGalleryImageUrl,
  getPerformanceLightboxImageUrl,
} from '@src/utils/sanityImage.js';
import { trackDataLayerEvent } from '@src/utils/analytics.js';
import './PostDetail.scss'; // Reuse post detail styles

function formatPerformanceDate(value) {
  if (!value) return null;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function PerformanceDetail({ onEntered }) {
  const { slug } = useParams();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    async function fetchPerformance() {
      const data = await getPerformanceBySlug(slug);
      setPerformance(data);
      setLoading(false);
    }
    fetchPerformance();
  }, [slug]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setLightboxImage(null);
      }
    }

    if (!lightboxImage) return undefined;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  if (loading) return <div className="post-detail-loading">読み込み中...</div>;
  if (!performance) return <div className="post-detail-error">公演情報が見つかりませんでした。</div>;

  const formattedDate = formatPerformanceDate(performance.performanceDate);
  const castMembers = Array.isArray(performance.cast) ? performance.cast : [];
  const additionalImages = Array.isArray(performance.additionalImages) ? performance.additionalImages : [];
  const mainImageUrl = getPerformanceDetailImageUrl(performance.mainImage);
  const performanceId = performance.slug || slug || performance._id || performance.title;
  const performanceTrackingId = performance.slug || performance._id || slug;
  const mainImageAnalyticsProps = {
    'data-gtm-category': 'engagement',
    'data-gtm-action': 'open',
    'data-gtm-label': 'image_open',
    'data-gtm-location': 'performance_detail',
    'data-gtm-type': 'performance_main_image',
    'data-gtm-value': performanceId,
  };

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
      {lightboxImage && (
        <div
          className="performance-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="公演画像の全体表示"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            className="performance-lightbox__close"
            onClick={() => setLightboxImage(null)}
            aria-label="画像を閉じる"
          >
            ×
          </button>
          <div className="performance-lightbox__content" onClick={(event) => event.stopPropagation()}>
            <img src={lightboxImage.src} alt={lightboxImage.alt} />
          </div>
        </div>
      )}
      <article className="post-detail performance-detail">
        <header className="post-detail__header">
          <Link
            to="/"
            className="post-detail__back"
            data-gtm-category="navigation"
            data-gtm-action="click"
            data-gtm-label="back_to_home"
            data-gtm-location="performance_detail"
            data-gtm-type="internal_link"
            data-gtm-value={slug}
          >← 戻る</Link>
          <h1 className="post-detail__title">{performance.title}</h1>
          <div className="post-detail__meta">
            {formattedDate && (
              <time className="performance-date" dateTime={performance.performanceDate}>
                開催日：{formattedDate}
              </time>
            )}
            {performance.venue && (
              <div className="performance-venue">場所：{performance.venue}</div>
            )}
          </div>
        </header>

        {mainImageUrl && (
          <button
            type="button"
            className="post-detail__image performance-image-button"
            onClick={() => {
              trackDataLayerEvent("performance_image_open", {
                performance_id: performanceTrackingId,
                image_scope: "main",
                image_index: 0,
              });
              setLightboxImage({
                src: getPerformanceLightboxImageUrl(performance.mainImage),
                alt: performance.title,
              });
            }}
            aria-label="公演画像を拡大表示"
            {...mainImageAnalyticsProps}
          >
            <img src={mainImageUrl} alt={performance.title} {...mainImageAnalyticsProps} />
          </button>
        )}

        <div className="post-detail__content">
          {castMembers.length > 0 && (
            <section className="performance-cast">
              <h3>キャスト</h3>
              <div className="performance-cast-list">
                {castMembers.map((member, index) => (
                  <article
                    key={`${member.actorName ?? 'actor'}-${member.roleName ?? 'role'}-${index}`}
                    className={`performance-cast-card ${member.photo ? '' : 'is-text-only'}`}
                  >
                    {member.photo ? (
                      <div className="performance-cast-card__image">
                        <img src={getPerformanceCastPhotoUrl(member.photo)} alt={member.actorName || member.roleName || performance.title} />
                      </div>
                    ) : null}
                    <div className="performance-cast-card__body">
                      {member.roleName && <p className="performance-cast-card__role">{member.roleName}</p>}
                      {member.actorName && <p className="performance-cast-card__name">{member.actorName}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {performance.staff && (
            <section className="performance-staff">
              <h3>スタッフ</h3>
              <div className="performance-staff__text">
                <PortableText value={performance.staff} />
              </div>
            </section>
          )}

          {/* <h3>公演詳細</h3> */}
          <PortableText value={performance.description} />

          {additionalImages.length > 0 && (
            <section className="performance-gallery">
              <h3>ギャラリー</h3>
              <div className="performance-gallery__grid">
                {additionalImages.map((imageUrl, index) => {
                  const galleryImageAnalyticsProps = {
                    'data-gtm-category': 'engagement',
                    'data-gtm-action': 'open',
                    'data-gtm-label': 'image_open',
                    'data-gtm-location': 'performance_detail',
                    'data-gtm-type': 'performance_gallery_image',
                    'data-gtm-value': `${performanceId}:${index + 1}`,
                  };

                  return (
                    <button
                      type="button"
                      key={`${imageUrl}-${index}`}
                      className="performance-gallery__item"
                      onClick={() => {
                        trackDataLayerEvent("performance_image_open", {
                          performance_id: performanceTrackingId,
                          image_scope: "gallery",
                          image_index: index + 1,
                        });
                        setLightboxImage({
                          src: getPerformanceLightboxImageUrl(imageUrl),
                          alt: `${performance.title} 追加画像 ${index + 1}`,
                        });
                      }}
                      aria-label={`追加画像 ${index + 1} を拡大表示`}
                      {...galleryImageAnalyticsProps}
                    >
                      <img
                        src={getPerformanceGalleryImageUrl(imageUrl)}
                        alt={`${performance.title} 追加画像 ${index + 1}`}
                        {...galleryImageAnalyticsProps}
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {performance.specialGoogleMapEmbedUrl && (
            <section className="performance-access">
              <h3>会場アクセス</h3>
              <div className="performance-access__map">
                <iframe
                  src={performance.specialGoogleMapEmbedUrl}
                  title={`${performance.title} 会場アクセス`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </section>
          )}
        </div>
      </article>
    </motion.section>
  );
}
