import "./NewsList.scss";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

let sitenewsPromise;
function prefetchSitenews() {
    if (!sitenewsPromise) {
        sitenewsPromise = fetch("/api/web-sitenews").then(async (res) => {
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
            return res.json();
        });
    }
    return sitenewsPromise;
}


export default function NewsList({ items, limit, className = "" }) {
    // const reduce = useReducedMotion();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // API からニュースを取得、ページ読み込み時に一度だけ実行
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

            try {
                const data = await prefetchSitenews(); // ここが“既に走ってる”可能性がある
                setNews((data));
            } catch (e) {
                console.error(e);
                setNews([]);
                setError("読み込みに失敗しました");
            } finally {
                setLoading(false);
            }}

            getNews()
    }, [])


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
    } catch {
        return iso;
    }
};

const NewsCardInner = ({ item }) => (
    <>
        <h3 className="news-card__title">{item.title}</h3>

        <div className="news-card__meta">
            <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
            {!item.hasBody ? <span className="news-card__note"></span> : null}
        </div>
    </>
);

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
    const source = Array.isArray(items) && items.length > 0 ? items : news;
    const data = source.slice(0, limit || source.length);

    if (loading) {
        return <div className={`news-list__empty ${className}`}>読み込み中...</div>;
    }

    if (error) {
        return <div className={`news-list__empty ${className}`}>{error}</div>;
    }

    if (data.length === 0) {
        return <div className={`news-list__empty ${className}`}>ニュースはまだありません。</div>;
    }

    return (
        <div className={`news-list ${className}`}>
            <h2 className="home-title">News Release</h2>
            {data.map((n) => (
                <article key={n.id} className="news-card">
                    {n.url ? (
                        <Link
                            to={n.url}
                            className="news-card__link"
                            data-gtm-category="content"
                            data-gtm-action="click"
                            data-gtm-label="news"
                            data-gtm-location="home"
                            data-gtm-type="news_card"
                            data-gtm-value={n.url}
                        >
                            <NewsCardInner item={n} />
                        </Link>
                    ) : (
                        <div className="news-card__link news-card__link--disabled" aria-disabled="true">
                            <NewsCardInner item={n} />
                        </div>
                    )}
                </article>
            ))}
        </div>
    );
};
