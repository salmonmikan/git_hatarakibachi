import { useEffect, useMemo, useState } from "react";
import supabase from '@/utils/supabase.ts'
import LogoutButton from "../component/logout";

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
        { title: "Total", value: stats.total },
        { title: "Draft", value: stats.draft },
        { title: "Public", value: stats.public },
        { title: "Private", value: stats.private },
    ]), [stats]);

    useEffect(() => {
        let alive = true;

        const run = async () => {
            setLoading(true);
            setError(null);

            // 1) status一覧を取って集計（最小構成のためクライアント集計）
            const s1 = await supabase.from("site_news").select("news_status").limit(5000);
            if (s1.error) {
                if (!alive) return;
                setError(s1.error.message);
                setLoading(false);
                return;
            }

            const rows = s1.data ?? [];
            const next = { total: rows.length, draft: 0, public: 0, private: 0 };
            for (const r of rows) {
                if (r.status === 0) next.draft += 1;
                else if (r.status === 1) next.public += 1;
                else if (r.status === 2) next.private += 1;
            }

            // 2) 最新5件
            const s2 = await supabase
                .from("site_news")
                .select("id,news_title,news_status,published_at")
                .order("published_at", { ascending: false })
                .limit(5);

            if (!alive) return;

            if (s2.error) {
                setError(s2.error.message);
                setStats(next);
                setRecent([]);
                setLoading(false);
                return;
            }

            setStats(next);
            setRecent(s2.data ?? []);
            setLoading(false);
        };

        run();

        return () => {
            alive = false;
        };
    }, []);

    return (
        <div style={{ display: "grid", gap: 14 }}>
            <div>
                <h1 style={{ margin: 0 }}>Dashboard</h1>
                <p style={{ marginTop: 6, opacity: 0.7 }}>
                    管理画面のトップ。ここに指標やショートカットを増やしていく想定。
                </p>
            </div>

            {error && (
                <div style={{ padding: 12, border: "1px solid #f3c", borderRadius: 12 }}>
                    <div style={{ color: "crimson", fontWeight: 700 }}>Error</div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>{error}</div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                        ※RLS/権限/テーブル名(news)の確認が必要です
                    </div>
                </div>
            )}

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                {cards.map((c) => (
                    <div key={c.title} style={{ border: "1px solid #eee", borderRadius: 14, padding: 14, background: "white" }}>
                        <div style={{ fontSize: 13, opacity: 0.7 }}>{c.title}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                            {loading ? "…" : c.value}
                        </div>
                    </div>
                ))}
            </section>

            <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 14, background: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h2 style={{ margin: 0, fontSize: 18 }}>Recent News</h2>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>latest 5</span>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    {loading ? (
                        <div style={{ opacity: 0.7 }}>Loading...</div>
                    ) : recent.length === 0 ? (
                        <div style={{ opacity: 0.7 }}>No items</div>
                    ) : (
                        recent.map((n) => (
                            <div key={n.id} style={{ padding: 10, border: "1px solid #f0f0f0", borderRadius: 12 }}>
                                <div style={{ fontWeight: 700 }}>{n.title}</div>
                                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                                    {STATUS_LABEL[n.status] ?? `status=${n.status}`} / {n.published_at ?? "-"}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
            <LogoutButton />
        </div>
    );
}
