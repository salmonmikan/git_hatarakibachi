// src/admin/pages/AdminMembers.jsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAdminCtx } from "../hooks/useAdminCtx";
import "./AdminMembers.scss";

export default function AdminMembers() {
    const ctx = useAdminCtx();
    const { data: members, loading: membersLoading, error: membersError } = ctx.lists.members;

    // const nav = useNavigate();
    // const back = () => nav("/", { replace: true });

    if (membersLoading) return <div className="admin-members">Loading...</div>;
    if (membersError) return <div className="admin-members">Error: {membersError}</div>;

    return (
        <div className="admin-members">
            <h1 className="admin-members__title">Manage Member</h1>

            <div className="admin-members__list">
                {members.map((m) => (
                    <Link
                        key={m.id}
                        to={String(m.id)} // ← /manage/members/:id へ
                        className="admin-members__link"
                    >
                        <div className="admin-members__name">{m.name ?? `member#${m.id}`}</div>
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
