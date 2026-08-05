import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
// import supabase from '@src/utils/supabase.ts'
import { fetchRecentNews, fetchRecentPerformances, fetchUpdateInfo } from "../components/DashBoardApi.js";
// import '@src/index.scss'
import { useAdminCtx } from "../hooks/useAdminCtx";
import MetricGrid from "../components/MetricGrid.jsx";
import Panel, { PanelSection } from "../components/Panel";
import ListShell from "../components/ListShell.jsx";
import { buildSanityStudioEditUrl, getAdminSanityDataset } from "../components/sanityStudioLink.js";

const STATUS_LABEL = {
    published: "公開中",
    private: "非公開",
};

export default function DashBoard() {
    const { lists } = useAdminCtx(); // 返ってきたオブジェクトの中から lists だけ抜き出して、同名の変数 lists に入れる
    const { data: members, loading: membersLoading } = lists.members;
    const { data: credits, loading: creditsLoading } = lists.credits;

    const [loading, setLoading] = useState(true);
    const [recent, setRecent] = useState([]);
    const [stageInfo, setStageInfo] = useState([]);
    const [error, setError] = useState(null);
    const [UpdateInfo, setUpdateInfo] = useState([]);
    const studioDataset = getAdminSanityDataset();

    // infoのトグル用
    const [openId, setOpenId] = useState(null);
    const toggle = (id) => {
        setOpenId((prev) => (prev === id ? null : id));
    };

    useEffect(() => {
        let alive = true;

        const run = async () => {
            setLoading(true);
            setError(null);

            const [r1, r2, r3] = await Promise.all([
                fetchRecentNews(),
                fetchRecentPerformances(),
                fetchUpdateInfo(),
            ]);

            // 1) status一覧を取って集計（最小構成のためクライアント集計）
            if (r1.error) {
                if (!alive) return;
                setError(r1.error);
                setLoading(false);
                return;
            }
            setRecent(r1.data ?? []);

            // 2) 最新5件
            // set処理
            if (r2.error) {
                setError(r2.error);
                setLoading(false);
                return;
            }
            setStageInfo(r2.data ?? []);

            // 3) Update諠・ｱ
            if (r3.error) {
                setError(r3.error);
                setLoading(false);
                return;
            }
            setUpdateInfo(r3.data ?? []);

            // 4) Update情報

            // 処理終了
            setLoading(false);
        };

        run();

        return () => {
            alive = false;
        };
    }, []);

    const memberItems = [
        {
            key: "total-members",
            to: "members",
            label: "所属人数",
            value: members?.length ?? 0,
            loading: membersLoading,
        },
        {
            key: "total-credits",
            to: "credits",
            label: "活動歴登録数",
            value: credits?.length ?? 0,
            loading: creditsLoading,
        },
        {
            key: "total-updates",
            to: "update-info",
            label: "更新情報登録数",
            value: lists.updates.data?.length ?? 0,
            loading: lists.updates.loading,
        },
    ];

    const truncateText = (s, max = 40) =>
        (s?.length ?? 0) > max ? s.slice(0, max) + "…" : s;


    return (
        <div className="adm-dash" data-layout="stack" style={undefined}>
            <header className="adm-dash__head">
                <h1 className="adm-dash__title">hatarakibachi Dashboard</h1>
                <p className="adm-dash__lead">
                    {`管理画面ダッシュボード`}
                </p>
            </header>

            {error && (
                <div className="adm-alert" data-tone="danger" role="alert">
                    <div className="adm-alert__label">Error</div>
                    <div className="adm-alert__msg">{error}</div>
                    <div className="adm-alert__note">※RLS/権限/テーブル名の確認が必要です</div>
                </div>
            )}

            <Panel
                kind="recent-news"
                title="Database Index"
                meta={`各指標から編集画面へ遷移できます \n ※webサイトへ即時反映されます。`}
            >
                <PanelSection title="劇団員管理">
                    <MetricGrid items={memberItems} />
                </PanelSection>

                {/* <PanelSection title="News登録情報管理">
                    <MetricGrid items={newsItems} />
                </PanelSection> */}
            </Panel>

            <div className="adm-dash__column-group">
                <Panel
                    kind="WEB"
                    title="Website URLs"
                    meta="公開サイト・検証サイトの確認はこちら"
                >
                    <div className="adm-cards" data-layout="grid" data-cols="auto-fit">
                        <Link
                            to="https://hatarakibachi.com"
                            className="adm-card"
                            data-surface="paper"
                            data-kind="metric"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div className="adm-card__label" data-color="black">
                                {`本番 (Prod)`}
                            </div>
                        </Link>
                        <Link
                            to="https://staging.hatarakibachi.com"
                            className="adm-card"
                            data-surface="paper"
                            data-kind="metric"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div className="adm-card__label" data-color="black">
                                {`検証 (Staging)`}
                            </div>
                        </Link>
                    </div>
                </Panel>

                <Panel
                    kind="CMS"
                    title="Sanity Studio"
                    meta="webサイト管理（公演情報等）はこちら"
                >
                    <div className="adm-cards" data-layout="grid" data-cols="auto-fit">
                        <Link
                            to="https://hatarakibachi.sanity.studio/production"
                            className="adm-card"
                            data-surface="paper"
                            data-kind="metric"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div className="adm-card__label" data-color="black">
                                {`本番 (Prod)`}
                            </div>
                        </Link>
                        <Link
                            to="https://hatarakibachi.sanity.studio/staging"
                            className="adm-card"
                            data-surface="paper"
                            data-kind="metric"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div className="adm-card__label" data-color="black">
                                {`検証 (Staging)`}
                            </div>
                        </Link>
                    </div>
                </Panel>

                <Panel
                    kind="stage-info"
                    title="Stage Info"
                    meta="latest 5"
                >
                    <ListShell loading={loading} hasItems={stageInfo?.length > 0}>
                        {stageInfo.map((item) => (
                            <a
                                key={item.id}
                                className="adm-item adm-item--link"
                                data-surface="soft"
                                href={buildSanityStudioEditUrl(item.id, "performance", studioDataset)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div className="adm-item__title">{item.title}</div>
                                <div className="adm-item__meta" data-tone="muted">
                                    {item.performanceDate ?? "-"} / {item.slug ?? "-"}
                                </div>
                            </a>
                        ))}
                    </ListShell>
                </Panel>

                <Panel
                    kind="recent-news"
                    title="Recent News"
                    meta="latest 5"
                >
                    <ListShell loading={loading} hasItems={recent?.length > 0}>
                        {recent.map((n) => (
                            <a
                                key={n.id}
                                className="adm-item adm-item--link"
                                data-surface="soft"
                                data-status={String(n.status)}
                                href={buildSanityStudioEditUrl(n.id, "news", studioDataset)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div className="adm-item__title">{n.title}</div>
                                <div className="adm-item__meta" data-tone="muted">
                                    {STATUS_LABEL[n.status] ?? `status=${n.status}`} / {n.publishedAt ?? "-"}
                                </div>
                            </a>
                        ))}
                    </ListShell>
                </Panel>
            </div>

            <Panel
                // kind="recent-news"
                title="Update Info"
                meta="latest 10"
                headRight={
                    <Link to="update-info" className="admin-view__link" data-visual="button" style={{ margin: 0 }}>
                        管理
                    </Link>
                }
            >
                <PanelSection title="">
                    <ul className="adm-update">
                        {UpdateInfo?.map((m) => {
                            const hasDesc = !!m.update_description?.trim();
                            const isOpen = openId === m.id;

                            return (
                                <li key={m.id} className={`adm-update__item ${isOpen ? "is-open" : ""}`}>
                                    <div className="adm-update__meta">
                                        <span className="adm-update__date">{m.update_date}</span>
                                        <span className="adm-update__category">
                                            {(m.categories ?? []).join(" / ")}
                                        </span>
                                    </div>

                                    {/* タイトル：詳細がある時だけクリック可能 */}
                                    {hasDesc ? (
                                        <button
                                            type="button"
                                            className="adm-update__title"
                                            onClick={() => toggle(m.id)}
                                            aria-expanded={isOpen}
                                        >
                                            {truncateText(m.update_title, 25)}
                                            <span className="adm-update__more"> 詳細...</span>
                                        </button>
                                    ) : (
                                        <span className="adm-update__title">
                                            {truncateText(m.update_title, 25)}
                                        </span>
                                    )}

                                    {/* 詳細：ある時だけ、開いてる時だけ */}
                                    {hasDesc && isOpen && (
                                        <div className="adm-update__desc">
                                            {m.update_description}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </PanelSection>
            </Panel>

            <div className="adm-dash__column-group">
                <Panel
                    kind="Future Releases"
                    title="Future Releases"
                    meta="対応予定機能"
                >
                    <div className="adm-cards" data-layout="grid" data-cols="auto-fit">
                        <Link
                            to="https://github.com/salmonmikan/git_hatarakibachi/issues"
                            className="adm-card"
                            data-surface="paper"
                            data-kind="metric"
                        >
                            <div className="adm-card__label" data-color="black">
                                {`GitHub Issues`}
                            </div>
                        </Link>
                    </div>
                </Panel>

                <Panel
                    kind="analytics"
                    title="Analytics"
                    meta="サイトアナリティクス"
                >
                    <div className="adm-cards" data-layout="grid" data-cols="auto-fit">
                        <Link
                            to="analytics"
                            className="adm-card"
                            data-surface="paper"
                            data-kind="metric"
                        >
                            <div className="adm-card__label" data-color="black">
                                {`Google Analytics(GA4)`}
                            </div>
                        </Link>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
