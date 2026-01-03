// src/admin/pages/MemberEditModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminCtx } from "../hooks/useAdminCtx";
import supabase from '@src/utils/supabase.ts'

export default function MemberEditModal() {
    const nav = useNavigate();
    const { id } = useParams();
    const memberId = Number(id);

    const { members, refreshMembers } = useAdminCtx(); // ← 中継されてる前提

    const memberFromList = useMemo(() => {
        return members?.find((m) => m.id === memberId) ?? null;
    }, [members, memberId]);

    const [loading, setLoading] = useState(false); // “1件取得”用（listに無い時）
    const [busy, setBusy] = useState(false);       // 保存中
    const [error, setError] = useState(null);

    // フォーム値（まずは最小）
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    // const [imageUrl, setImageUrl] = useState("");

    const close = () => nav("..", { replace: true });

    // 初期値セット（listにあれば即）
    useEffect(() => {
        if (!memberFromList) return;
        setName(memberFromList.name ?? "");
        setBio(memberFromList.bio ?? "");
        // setImageUrl(memberFromList.image_url ?? "");
    }, [memberFromList]);

    // listに無い場合の保険：idで1件取りに行く
    useEffect(() => {
        let alive = true;

        const fetchOneIfNeeded = async () => {
            if (memberFromList) return;
            if (!Number.isFinite(memberId)) return;

            setLoading(true);
            setError(null);

            const res = await supabase
                .from("members")
                .select("*")
                .eq("id", memberId)
                .maybeSingle();

            if (!alive) return;

            if (res.error) {
                setError(res.error.message);
                setLoading(false);
                return;
            }

            const row = res.data;
            setName(row?.name ?? "");
            setBio(row?.bio ?? "");
            // setImageUrl(row?.image_url ?? "");
            setLoading(false);
        };

        fetchOneIfNeeded();

        return () => {
            alive = false;
        };
    }, [memberFromList, memberId]);

    // ESCで閉じる + 背面スクロール抑制
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKeyDown);

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prev;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSave = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);

        // 変更するカラムだけ update する
        const payload = {
            name: name.trim(),
            bio,
            // image_url: imageUrl.trim() || null,
        };

        const res = await supabase
            .from("members")
            .update(payload)
            .eq("id", memberId)
            .select();

        if (res.error) {
            setError(res.error.message);
            setBusy(false);
            return;
        }
        console.log("update res:", res);

        // 一覧のキャッシュを更新（あなたの方針的に refreshAll でOK）
        await refreshMembers?.();

        setBusy(false);
        close();
    };

    return (
        <div
            role="presentation"
            onClick={close}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "grid",
                placeItems: "center",
                padding: 16,
                zIndex: 50,
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "min(760px, 100%)",
                    background: "white",
                    borderRadius: 14,
                    border: "1px solid #eee",
                    padding: 16,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Edit Member</h2>
                        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.65 }}>id: {id}</div>
                    </div>
                    <button onClick={close} disabled={busy}>Close</button>
                </div>

                {(loading) && (
                    <div style={{ marginTop: 12, opacity: 0.7 }}>Loading...</div>
                )}

                {error && (
                    <div style={{ marginTop: 12, padding: 12, border: "1px solid #f3c", borderRadius: 12 }}>
                        <div style={{ color: "crimson", fontWeight: 700 }}>Error</div>
                        <div style={{ marginTop: 6, fontSize: 13 }}>{error}</div>
                    </div>
                )}

                <form onSubmit={onSave} style={{ marginTop: 14, display: "grid", gap: 12 }}>
                    <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 13, opacity: 0.8 }}>Name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={busy || loading}
                            required
                            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                        />
                    </label>

                    <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 13, opacity: 0.8 }}>Bio</span>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            disabled={busy || loading}
                            rows={6}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", resize: "vertical" }}
                        />
                    </label>

                    {/* <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 13, opacity: 0.8 }}>Image URL</span>
                        <input
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            disabled={busy || loading}
                            placeholder="https://..."
                            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                        />
                    </label> */}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                        <button type="button" onClick={close} disabled={busy}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={busy || loading}
                            style={{
                                padding: "10px 14px",
                                borderRadius: 10,
                                border: "1px solid #ddd",
                                cursor: busy ? "not-allowed" : "pointer",
                            }}
                        >
                            {busy ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
