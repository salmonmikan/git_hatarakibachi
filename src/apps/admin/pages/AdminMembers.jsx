// src/admin/pages/AdminMembers.jsx
import { Link, Outlet } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAdminCtx } from "../hooks/useAdminCtx";
import { SortableList } from "../components/Parts/SortableList.jsx";
import "./admin_view.scss";
import supabase from '@src/utils/supabase.ts'

const GAP = 100;
const toNum = (x) => {
    if (x == null) return null;
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
};
const calcDisplayOrder = (prevOrder, nextOrder) => {
    const prev = toNum(prevOrder);
    const next = toNum(nextOrder);
    if (prev != null && next != null) return (prev + next) / 2;
    if (prev != null && next == null) return prev + GAP;
    if (prev == null && next != null) return next - GAP;
    return 0;
};

export default function AdminMembers() {
    const ctx = useAdminCtx();
    const { data: members, loading: membersLoading, error: membersError } = ctx.lists.members;
    // const supabase = supabase; // ↁEctxにsupabase入れてなぁE��ら、supabaseの取り方に合わせて
    const refreshMembers = ctx.lists.members.refresh;

    const [membersUI, setMembersUI] = useState([]);

    useEffect(() => {
        setMembersUI(members ?? []);
    }, [members]);

    const onReorder = useCallback(
        async ({ newIndex, nextItems }) => {
            setMembersUI(nextItems);

            const moved = nextItems[newIndex];
            const prev = nextItems[newIndex - 1];
            const next = nextItems[newIndex + 1];
            const newOrder = calcDisplayOrder(prev?.display_order, next?.display_order);

            const res = await supabase
                .from("members")
                .update({ display_order: newOrder })
                .eq("id", moved.id);

            if (res.error) {
                await refreshMembers();
            } else {
                setMembersUI((arr) =>
                    arr.map((m) => (m.id === moved.id ? { ...m, display_order: newOrder } : m))
                );
            }
        },
        [supabase, refreshMembers]
    );

    if (membersLoading) return <div className="admin-view">Loading...</div>;
    if (membersError) return <div className="admin-view">Error: {membersError}</div>;

    return (
        <div className="admin-view">
            <h1 className="admin-view__title">Manage Members</h1>

            <div className="admin-view__stack">
                <Link to="new" className="admin-view__link" data-visual="button">
                    追加
                </Link>

                <div className="admin-view__list">
                    <SortableList
                        items={membersUI}
                        getId={(m) => m.id}
                        onReorder={onReorder}
                        className="admin-view__list-inner"
                        renderItem={(m) => (
                            <Link to={String(m.id)} className="admin-view__link">
                                <div className="admin-view__name">{m.name ?? `member#${m.id}`}</div>
                            </Link>
                        )}
                    />
                </div>
            </div>

            <Outlet context={ctx} />
        </div>
    );
}
