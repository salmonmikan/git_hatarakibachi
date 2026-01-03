// src/admin/pages/MemberEditModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormField from "./FormField.jsx";

import { useAdminCtx } from "../hooks/useAdminCtx";
import supabase from "@src/utils/supabase.ts";

import "./MemberEditModal.scss";

export default function MemberEditModal() {
    const nav = useNavigate();
    const { id } = useParams();
    const memberId = Number(id);

    const { members, refreshMembers } = useAdminCtx();

    const memberFromList = useMemo(() => {
        return members?.find((m) => m.id === memberId) ?? null;
    }, [members, memberId]);

    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    // フォーム状態, まとめて扱う
    const [form, setForm] = useState({ name: "", bio: "" });

    const onChange = (e) => {
        const { name, value } = e.target;
        // previous stateを基に更新
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const close = () => nav("..", { replace: true });

    useEffect(() => {
        // console.log("apply from list", memberFromList?.id);
        if (!memberFromList) return;
        setForm((prev) => ({
            // 更新しないものはそのまま維持
            ...prev,
            name: memberFromList?.name ?? "",
            bio: memberFromList?.bio ?? "",
        }));
    }, [memberFromList?.id]);

    useEffect(() => {
        // console.log("apply from list", memberFromList?.id);
        let alive = true;

        const fetchOneIfNeeded = async () => {
            if (memberFromList) return;
            if (!Number.isFinite(memberId)) return;

            setLoading(true);
            setError(null);

            const res = await supabase.from("members").select("*").eq("id", memberId).maybeSingle();

            if (!alive) return;

            if (res.error) {
                setError(res.error.message);
                setLoading(false);
                return;
            }

            const row = res.data;
            setForm((prev) => ({
                ...prev,
                name: row?.name ?? "",
                bio: row?.bio ?? "",
            }));
            setLoading(false);
        };

        fetchOneIfNeeded();

        return () => {
            alive = false;
        };
    }, [memberFromList, memberId]);

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

        const payload = {
            name: form.name.trim(),
            bio: form.bio,
        };

        const res = await supabase.from("members").update(payload).eq("id", memberId).select();

        if (res.error) {
            setError(res.error.message);
            setBusy(false);
            return;
        }

        await refreshMembers?.();
        setBusy(false);
        close();
    };

    return (
        <div
            className="mem-modal"
            role="presentation"
            onClick={close}
            data-busy={busy ? "true" : "false"}
            data-loading={loading ? "true" : "false"}
        >
            <div
                className="mem-modal__panel"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="mem-modal__header">
                    <div>
                        <h2 className="mem-modal__title">Edit Member</h2>
                        <div className="mem-modal__sub">id: {id}</div>
                    </div>

                    <button className="mem-modal__close" onClick={close} disabled={busy}>
                        Close
                    </button>
                </header>

                {loading && <div className="mem-modal__hint">Loading...</div>}

                {error && (
                    <div className="mem-modal__error">
                        <div className="mem-modal__errorTitle">Error</div>
                        <div className="mem-modal__errorBody">{error}</div>
                    </div>
                )}

                <form className="mem-form" onSubmit={onSave}>
                    <FormField label="Name">
                        <input
                            name="name"
                            className="mem-form__input"
                            value={form.name}
                            onChange={onChange}
                            disabled={busy || loading}
                            required
                        />
                    </FormField>

                    <FormField label="Bio">
                        <textarea
                            name="bio"
                            className="mem-form__textarea"
                            value={form.bio}
                            onChange={onChange}
                            disabled={busy || loading}
                            rows={6}
                        />
                    </FormField>

                    <div className="mem-form__actions">
                        <button className="mem-btn mem-btn--ghost" type="button" onClick={close} disabled={busy}>
                            Cancel
                        </button>

                        <button className="mem-btn mem-btn--primary" type="submit" disabled={busy || loading}>
                            {busy ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
