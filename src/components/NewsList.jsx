import React from "react";
import "./NewsList.scss";
import { useState, useEffect } from "react";
import supabase from '../utils/supabase.ts'

export default function NewsList({ items, limit, className = "" }) {
    // const reduce = useReducedMotion();
    const [selected, setSelected] = useState(null);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // supabaseから情報を取得、ページ読み込み時に一度だけ実行
    useEffect(() => {
        // function groupByYear(credits = []) {
        //     const byYear = credits.reduce((acc, c) => {
        //         const y = c.credit_date?.slice(0, 4) ?? 'unknown';
        //         (acc[y] ??= []).push(c);
        //         return acc;
        //     }, {});

        //     // 年の中は新しい順（文字列でも YYYY-MM-DD なら比較できる）
        //     for (const y of Object.keys(byYear)) {
        //         byYear[y].sort((a, b) => (b.credit_date ?? '').localeCompare(a.credit_date ?? ''));
        //     }

        //     return byYear;
        // }

        async function getNews() {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('site_news')
                .select(`*`)
                .limit(5)
                .eq("news_status", 1)
                .order('id', { ascending: true });

            if (error) {
                console.error('supabase select error ->', error);
                setNews([]);
                setError(error.message ?? '読み込みに失敗しました');
            } else {
                setNews(data);
            }
            setLoading(false);
        }
        getNews()
    }, [])

// ---- ダミーJSON（まずは直書き） ----
// const NEWS = [
//     {
//         id: "1",
//         category: "公演情報",
//         title: "公演情報を更新しました",
//         // url: "https://example.com/post/serverless-news",
//         imageUrl: "https://picsum.photos/seed/news1/800/420",
//         publishedAt: "2025-09-29T12:34:56Z",
//         tags: ["公演", "脚本"],
//         summary:
//             "新作公演『はたらきばち』の詳細情報を公開しました。",
//     },
//     {
//         id: "2",
//         category: "メンバー募集",
//         title: "メンバー募集を開始しました",
//         // url: "https://example.com/post/serverless-news-2",
//         imageUrl: "https://picsum.photos/seed/news2/800/420",
//         publishedAt: "2025-10-05T09:00:00Z",
//         tags: ["募集", "役者"],
//         summary:
//             "新作公演に向けて、役者やスタッフを募集しています。興味のある方はぜひご応募ください。",
//     },
//     {
//         id: "3",
//         category: "イベント",
//         title: "オンラインイベントを開催しました",
//         // url: "https://example.com/post/serverless-news-3",
//         imageUrl: "https://picsum.photos/seed/news3/800/420",
//         publishedAt: "2025-10-15T18:00:00Z",
//         tags: ["イベント", "オンライン"],
//         summary:
//             "オンラインでのトークイベントを開催しました。多くの方にご参加いただき、ありがとうございました。",
//     },
// ];

// ---- ユーティリティ ----
const formatDate = (iso) => {
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit", // 日付まで
            // hour: "2-digit",
            // minute: "2-digit",
            // hour12: false,
        }).format(d);
    } catch (e) {
        return iso;
    }
};

                        // {n.imageUrl ? (
                        //     <div className="news-card__image">
                        //         {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        //         <img src={n.imageUrl} loading="lazy" />
                        //     </div>
                        // ) : (
                        //     <div className="news-card__image news-card__image--placeholder">
                        //         <span>No image</span>
                        //     </div>
                        // )}

                        // {n.summary ? (
                        //     <p className="news-card__summary">{n.summary}</p>
                        // ) : null}

// ---- コンポーネント本体 ----
    const data = (news || NEWS).slice(0, limit || (news || NEWS).length);

    if (data.length === 0) {
        return <div className={`news-list__empty ${className}`}>ニュースはまだありません。</div>;
    }

    return (
        <div className={`news-list ${className}`}>
            {data.map((n) => (
                <article key={n.id} className="news-card">
                    <a
                        href={n.url}
                        target="_blank"
                        rel="noreferrer"
                        className="news-card__link"
                    >

                        <h3 className="news-card__title">{n.news_title}</h3>

                        <div className="news-card__meta">
                            <time dateTime={n.published_at}>{formatDate(n.published_at)}</time>
                            <span className="news-card__dot" aria-hidden>
                                •
                            </span>
                            <span className="news-card__source" title={n.news_category}>
                                {n.news_category}
                            </span>
                            {/* {Array.isArray(n.tags) && n.tags.length > 0 ? (
                                <span className="news-card__tags">
                                    {n.tags.slice(0, 3).map((t) => (
                                        <span key={t} className="news-tag">
                                            {t}
                                        </span>
                                    ))}
                                </span>
                            ) : null} */}
                        </div>
                    </a>
                </article>
            ))}
        </div>
    );
};