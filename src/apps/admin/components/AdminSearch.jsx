import { useMemo, useState } from "react";


export default function AdminSearch({ ctx, credits, children }) {
    const members = ctx?.lists?.members?.data ?? [];
    const loading = !!ctx?.lists?.members?.loading;

    const [q, setQ] = useState("");
    const [memberId, setMemberId] = useState("");

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        return (credits ?? [])
            .filter((c) => !qq || `${c.credit_title ?? ""} ${c.credit_role ?? ""}`.toLowerCase().includes(qq))
            .filter((c) => !memberId || String(c.member_id) === String(memberId));
    }, [credits, q, memberId]);

    return (
        <>
            <div className="admin_member__search">
                <label className="admin_member__field">
                    <span className="admin_member__label">検索</span>
                    <input
                        value={q}
                        placeholder="タイトル / 役職・役名"
                        onChange={(e) => setQ(e.target.value)}
                    />
                </label>

                <label className="admin_member__field">
                    <span className="admin_member__label">メンバー</span>
                    <select
                        value={memberId}
                        disabled={loading}
                        onChange={(e) => setMemberId(e.target.value)}
                    >
                        <option value="">{loading ? "読み込み中..." : "全て"}</option>
                        {members.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {children(filtered)}
        </>
    );
}
