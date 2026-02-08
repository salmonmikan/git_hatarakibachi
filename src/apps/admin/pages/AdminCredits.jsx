// src/admin/pages/AdminCredits.jsx
import { useMemo } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAdminCtx } from "../hooks/useAdminCtx";
import "./admin_view.scss";
import AdminSearch from "../components/AdminSearch";
// import CreditFilter from "../components/CreditFilter.jsx";

export default function AdminCredits() {
    const ctx = useAdminCtx();
    const { data: credits, loading: creditsLoading, error: creditsError } = ctx.lists.credits;

    if (creditsLoading) return <div className="admin-view">Loading...</div>;
    if (creditsError) return <div className="admin-view">Error: {creditsError}</div>;

    return (
        <div className="admin-view">
            <h1 className="admin-view__title">Manage Credits</h1>
            <Link to="new" className="admin-view__link" data-visual="button">
                追加
            </Link>

            <AdminSearch
                ctx={ctx}
                credits={credits}>
                {(filtered) => (
                    <div className="admin-view__list">
                        {filtered.map((c) => (
                            <Link
                                key={c.id}
                                to={String(c.id)} // to CreditEditModal.jsx
                                className="admin-view__link"
                            >
                                <div className="admin-view__name">{`${c.credit_title}/${c.member.name}`}</div>
                            </Link>
                        ))}
                    </div>
                )}
            </AdminSearch>

            {/* ここにモーダル（members/:id）が重なる */}
            <Outlet context={ctx} />
        </div>
    );
}
