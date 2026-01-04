// src/admin/pages/MemberEditModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormField from "../FormField.jsx";

import { useAdminCtx } from "../../hooks/useAdminCtx.js";
import supabase from "@src/utils/supabase.ts";

import "./AdminEditModal.scss";

export default function CreditEditModal() {
    const nav = useNavigate();
    const { id } = useParams();
    const creditId = Number(id);

    const { lists } = useAdminCtx();
    const { data: CtxData, loading: CtxDataLoading, error: CtxDataError, refresh: CtxDataRefresh } = lists.credits;

    const CtxFromList = useMemo(() => {
        return CtxData?.find((m) => m.id === creditId) ?? null;
    }, [CtxData, creditId]);

    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    // フォーム状態, まとめて扱う
    const [form, setForm] = useState({ credit_title: "", credit_role: "", credit_date: "" });

    const onChange = (e) => {
        const { name, value } = e.target;
        // previous stateを基に更新
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const close = () => nav("..", { replace: true });

    useEffect(() => {
        // console.log("apply from list", creditFromList?.id);
        if (!CtxFromList) return;
        setForm((prev) => ({
            // 更新しないものはそのまま維持
            ...prev,
            credit_title: CtxFromList?.credit_title ?? "",
            credit_role: CtxFromList?.credit_role ?? "",
            credit_date: CtxFromList?.credit_date ?? "",
            // role: CtxFromList?.role ?? "",
            // skill: CtxFromList?.skill ?? "",
            // hobby: CtxFromList?.hobby ?? "",
        }));
    }, [CtxFromList?.id]);

    useEffect(() => {
        // console.log("apply from list", creditFromList?.id);
        let alive = true;

        const fetchOneIfNeeded = async () => {
            if (CtxFromList) return;
            if (!Number.isFinite(creditId)) return;

            setLoading(true);
            setError(null);

            const res = await supabase.from("credits").select("*").eq("id", creditId).maybeSingle();

            if (!alive) return;

            if (res.error) {
                setError(res.error.message);
                setLoading(false);
                return;
            }

            const row = res.data;
            setForm((prev) => ({
                ...prev,
                credit_title: row?.credit_title ?? "",
                credit_role: row?.credit_role ?? "",
                credit_date: row?.credit_date ?? "",
                // role: row?.role ?? "",
                // skill: row?.skill ?? "",
                // hobby: row?.hobby ?? "",
            }));
            setLoading(false);
        };

        fetchOneIfNeeded();

        return () => {
            alive = false;
        };
    }, [CtxFromList, creditId]);

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
            credit_title: form.credit_title.trim(),
            credit_role: form.credit_role.trim(),
            credit_date: form.credit_date.trim(),
            // role: form.role.trim(),
            // skill: form.skill.trim(),
            // hobby: form.hobby.trim(),
        };

        const res = await supabase.from("credits").update(payload).eq("id", creditId).select();

        if (res.error) {
            setError(res.error.message);
            setBusy(false);
            return;
        }

        await CtxDataRefresh?.();
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
                        <h2 className="mem-modal__title">Edit Credit</h2>
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
                    <FormField label="タイトル">
                        <input
                            name="credit_title"
                            className="mem-form__input"
                            value={form.credit_title}
                            onChange={onChange}
                            disabled={busy || loading}
                            required
                        />
                    </FormField>

                    <FormField label="役職・役名">
                        <input
                            name="credit_role"
                            className="mem-form__input"
                            value={form.credit_role}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>

                    <FormField label="活動年">
                        <input
                            type="date"
                            name="bio"
                            className="mem-form__textarea"
                            value={form.credit_date}
                            onChange={onChange}
                            disabled={busy || loading}
                            rows={6}
                        />
                    </FormField>

                    {/* <FormField label="役職">
                        <input
                            name="role"
                            className="mem-form__input"
                            value={form.role}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>

                    <FormField label="特技">
                        <input
                            name="skill"
                            className="mem-form__input"
                            value={form.skill}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>

                    <FormField label="趣味">
                        <input
                            name="hobby"
                            className="mem-form__input"
                            value={form.hobby}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField> */}

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
