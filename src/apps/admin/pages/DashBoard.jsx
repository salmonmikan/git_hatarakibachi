import { Component, useEffect, useMemo, useState } from "react";
import supabase from '@src/utils/supabase.ts'
import LogoutButton from "../components/LogoutButton.jsx";
import {fetchNewsStats, fetchRecentCredits, fetchRecentNews} from "../components/DashBoardApi.js";

const STATUS_LABEL = {
    0: "下書き",
    1: "公開",
    2: "非公開",
};

export default function DashBoard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, draft: 0, public: 0, private: 0 });
    const [recent, setRecent] = useState([]);
    const [error, setError] = useState(null);

    const cards = useMemo(() => ([
        { title: "合計", value: stats.total },
        { title: "下書き", value: stats.draft },
        { title: "公開中", value: stats.public },
        { title: "非公開", value: stats.private },
    ]), [stats]);

    useEffect(() => {
        let alive = true;

        const run = async () => {
            setLoading(true);
            setError(null);

            const [r1, r2, r3] = await Promise.all([
                fetchNewsStats(),
                fetchRecentNews(),
                fetchRecentCredits(),
            ]);

            // 1) status一覧を取って集計（最小構成のためクライアント集計）
            if (r1.error) {
                if (!alive) return;
                setError(s1.error.message);
                setLoading(false);
                return;
            }
            const rows = r1.data ?? [];
            const next = { total: rows.total, draft: rows.draft, public: rows.public, private: rows.private };

            // 2) 最新5件
            // set処理
            if (r2.error) {
                setError(s2.error.message);
                setRecent([]);
                setLoading(false);
                return;
            }
            setStats(next);
            setRecent(r2.data ?? []);
            setLoading(false);
        };

        run();

        return () => {
            alive = false;
        };
    }, []);

    return (
        <div className="adm-dash" data-layout="stack" style={undefined}>
            <header className="adm-dash__head">
                <h1 className="adm-dash__title">hatarakibachi Dashboard</h1>
                <p className="adm-dash__lead">
                    管理画面ダッシュボード
                </p>
            </header>

            {error && (
                <div className="adm-alert" data-tone="danger" role="alert">
                    <div className="adm-alert__label">Error</div>
                    <div className="adm-alert__msg">{error}</div>
                    <div className="adm-alert__note">※RLS/権限/テーブル名の確認が必要です</div>
                </div>
            )}

            <div className="adm-title">News登録状況</div>
            <section
                className="adm-cards"
                data-layout="grid"
                data-cols="auto-fit"
            >
                {cards.map((c) => (
                    <div
                        key={c.title}
                        className="adm-card"
                        data-surface="paper"
                        data-kind="metric"
                    >
                        <div className="adm-card__label">{c.title}</div>
                        <div
                            className="adm-card__value"
                            data-loading={loading ? "true" : "false"}
                        >
                            {loading ? "…" : c.value}
                        </div>
                    </div>
                ))}
            </section>

            <section className="adm-panel" data-surface="paper" data-kind="recent-news">
                <div className="adm-panel__head" data-layout="row" data-justify="between">
                    <h2 className="adm-panel__title">Recent News</h2>
                    <span className="adm-panel__meta" data-size="xs">latest 5</span>
                </div>

                <div className="adm-list" data-state={loading ? "loading" : (recent.length === 0 ? "empty" : "ready")}>
                    {loading ? (
                        <div className="adm-list__placeholder" data-tone="muted">Loading...</div>
                    ) : recent.length === 0 ? (
                        <div className="adm-list__placeholder" data-tone="muted">No items</div>
                    ) : (
                        recent.map((n) => (
                            <article
                                key={n.id}
                                className="adm-item"
                                data-surface="soft"
                                data-status={String(n.status)}
                            >
                                <div className="adm-item__title">{n.news_title}</div>
                                <div className="adm-item__meta" data-tone="muted">
                                    {STATUS_LABEL[n.news_status] ?? `status=${n.news_status}`} / {n.published_at ?? "-"}
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </section>

            <div className="adm-dash__foot">
                <LogoutButton />
            </div>
        </div>
    );
}
