// src/admin/pages/AdminMembers.jsx
import { Link, Outlet } from "react-router-dom";
import { useAdminCtx } from "../hooks/useAdminCtx";

export default function AdminMembers() {
    const ctx = useAdminCtx();
    const { members, membersLoading, membersError } = ctx;

    if (membersLoading) return <div style={{ padding: 16 }}>Loading...</div>;
    if (membersError) return <div style={{ padding: 16 }}>Error: {membersError}</div>;

    return (
        <div style={{ padding: 16 }}>
            <h1 style={{ margin: 0 }}>Manage Member</h1>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {members.map((m) => (
                    <Link
                        key={m.id}
                        to={String(m.id)} // ← /manage/members/:id へ（相対なのでこれでOK）
                        style={{
                            display: "block",
                            border: "1px solid #eee",
                            borderRadius: 12,
                            padding: 10,
                            textDecoration: "none",
                            color: "inherit",
                            background: "white",
                        }}
                    >
                        <div style={{ fontWeight: 700 }}>{m.name ?? `member#${m.id}`}</div>
                        {/* <div style={{ fontSize: 12, opacity: 0.7 }}>id: {m.id}</div> */}
                    </Link>
                ))}
            </div>

            {/* ここにモーダル（members/:id）が重なる */}
            <Outlet context={ctx} />
        </div>
    );
}
