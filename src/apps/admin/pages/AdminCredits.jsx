// src/admin/pages/AdminMembers.jsx
import { useMemo } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAdminCtx } from "../hooks/useAdminCtx";
import "./AdminCredits.scss";
import AdminSearch from "../components/AdminSearch";
// import CreditFilter from "../components/CreditFilter.jsx";

export default function AdminCredits() {
    const ctx = useAdminCtx();
    const { data: credits, loading: creditsLoading, error: creditsError } = ctx.lists.credits;

    if (creditsLoading) return <div className="admin-members">Loading...</div>;
    if (creditsError) return <div className="admin-members">Error: {creditsError}</div>;


    return (
        <div className="admin-members">
            <h1 className="admin-members__title">Manage Credits</h1>
            <Link to="new" className="admin-members__link" data-visual="button">
                追加
            </Link>

            <AdminSearch
                ctx={ctx}
                credits={credits}>
                
                {(filtered) => (
                    <div className="admin-members__list">
                        {filtered.map((c) => (
                            <Link 
                                key={c.id}
                                to={String(c.id)} // to CreditEditModal.jsx
                                className="admin-members__link"
                            >
                                <div className="admin-members__name">{`${c.credit_title}/${c.member.name}`}</div>
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
