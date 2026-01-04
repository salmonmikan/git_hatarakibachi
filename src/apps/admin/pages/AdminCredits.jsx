// src/admin/pages/AdminMembers.jsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAdminCtx } from "../hooks/useAdminCtx";
import "./AdminCredits.scss";

export default function AdminCredits() {
    const ctx = useAdminCtx();
    const { data: credits, loading: creditsLoading, error: creditsError } = ctx.lists.credits;
    
    // const nav = useNavigate();
    // const back = () => nav("/", { replace: true });

    if (creditsLoading) return <div className="admin-members">Loading...</div>;
    if (creditsError) return <div className="admin-members">Error: {creditsError}</div>;

    return (
        <div className="admin-members">
            <h1 className="admin-members__title">Manage Credit</h1>

            <div className="admin-members__list">
                {credits.map((m) => (
                    <Link
                        key={m.id}
                        to={String(m.id)}
                        className="admin-members__link"
                    >
                        <div className="admin-members__name">{`${m.credit_title}`}</div>
                        {/* <div style={{ fontSize: 12, opacity: 0.7 }}>id: {m.id}</div> */}
                    </Link>
                ))}
            </div>

            {/* <button className="admin-members__button" type="button" onClick={back}>
                back
            </button> */}

            {/* ここにモーダル（members/:id）が重なる */}
            <Outlet context={ctx} />
        </div>
    );
}
