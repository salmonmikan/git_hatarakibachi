// src/admin/pages/MemberEditModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormField from "../FormField.jsx";

import { useAdminCtx } from "../../hooks/useAdminCtx.js";
// import supabase from "@src/utils/supabase.ts";

import "./AdminEditModal.scss";

export default function CreditEditModal() {
    const nav = useNavigate();
    const { id } = useParams();
    const isNew = id === "new";
    const creditId = isNew ? null : Number(id);

    const { lists } = useAdminCtx();
    const { data: CtxData, loading: CtxDataLoading, error: CtxDataError, refresh: CtxDataRefresh, add, update, remove } = lists.credits;
    const { data: members, loading: membersLoading } = lists.members;

    const CtxFromList = useMemo(() => {
        if (isNew) return null;
        return (CtxData ?? []).find((c) => c.id === creditId) ?? null;
    }, [CtxData, creditId, isNew]);

    // const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null); // 個別エラー管理

    // フォーム状態, まとめて扱う
    const [form, setForm] = useState({ credit_title: "", credit_role: "", credit_date: "", member_id: "" });

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
            member_id: CtxFromList?.member_id ?? "",
            credit_title: CtxFromList?.credit_title ?? "",
            credit_role: CtxFromList?.credit_role ?? "",
            credit_date: CtxFromList?.credit_date ?? "",
        }));
    }, [CtxFromList?.id]);

    // useEffect(() => {
    //     // console.log("apply from list", creditFromList?.id);
    //     let alive = true;

    //     const fetchOneIfNeeded = async () => {
    //         if (CtxFromList) return;
    //         if (!Number.isFinite(creditId)) return;

    //         setLoading(true);
    //         setError(null);

    //         const res = await supabase.from("credits").select("*").eq("id", creditId).maybeSingle();

    //         if (!alive) return;

    //         if (res.error) {
    //             setError(res.error.message);
    //             setLoading(false);
    //             return;
    //         }

    //         const row = res.data;
    //         setForm((prev) => ({
    //             ...prev,
    //             credit_title: row?.credit_title ?? "",
    //             credit_role: row?.credit_role ?? "",
    //             credit_date: row?.credit_date ?? "",
    //         }));
    //         setLoading(false);
    //     };

    //     fetchOneIfNeeded();

    //     return () => {
    //         alive = false;
    //     };
    // }, [CtxFromList, creditId]);

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
            member_id: Number(form.member_id),
            credit_title: form.credit_title.trim(),
            credit_role: form.credit_role.trim(),
            credit_date: form.credit_date || null,
        };

        const res = isNew
            ? await add(payload)
            : await update(id, payload);

        if (res.error) {
            setError(res.error.message);
            setBusy(false);
            return;
        }

        await CtxDataRefresh?.();
        setBusy(false);
        close();
    };

    const onDelete = async () => {
        if (isNew) return;
        if (!Number.isFinite(creditId)) return;

        const ok = window.confirm("削除しますか？");
        if (!ok) return;

        setBusy(true);
        setError(null);

        const res = await remove(creditId);

        if (res.error) {
            setError(error.message ?? "削除に失敗しました");
            setBusy(false);
            return;
        }

        setBusy(false);
        window.alert("正常に削除しました。");
        nav("..", { replace: true }); // 一覧へ戻る（モーダル閉じる）
    };

    return (
        <div
            className="mem-modal"
            role="presentation"
            onClick={close}
            data-busy={busy ? "true" : "false"}
            data-loading={CtxDataLoading ? "true" : "false"}
        >
            <div
                className="mem-modal__panel"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="mem-modal__header">
                    <div>
                        <h2 className="mem-modal__title">
                            {isNew ? "add Credit" : `Edit Credit`}
                        </h2>
                        <div className="mem-modal__sub">id: {id}</div>
                    </div>

                    <button className="mem-modal__close" onClick={close} disabled={busy}>
                        Close
                    </button>
                </header>

                {CtxDataLoading && <div className="mem-modal__hint">Loading...</div>}

                {CtxDataError && (
                    <div className="mem-modal__error">
                        <div className="mem-modal__errorTitle">Error</div>
                        <div className="mem-modal__errorBody">{CtxDataError}</div>
                    </div>
                )}

                <form className="mem-form" onSubmit={onSave}>
                    <FormField label="relational member *必須">
                        <select
                            name="member_id"
                            className="mem-form__input"
                            value={form.member_id}
                            onChange={onChange}
                            disabled={busy || CtxDataLoading || membersLoading}
                            required
                        >
                            <option value="" disabled>
                                メンバーを選択…
                            </option>

                            {(members ?? []).map((m) => (
                                <option key={m.id} value={String(m.id)}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="タイトル *必須">
                        <input
                            name="credit_title"
                            className="mem-form__input"
                            value={form.credit_title}
                            onChange={onChange}
                            disabled={busy || CtxDataLoading}
                            required
                        />
                    </FormField>

                    <FormField label="役職・役名">
                        <input
                            name="credit_role"
                            className="mem-form__input"
                            value={form.credit_role}
                            onChange={onChange}
                            disabled={busy || CtxDataLoading}
                        />
                    </FormField>

                    <FormField label="活動年">
                        <input
                            type="date"
                            name="credit_date"
                            className="mem-form__input"
                            value={form.credit_date}
                            onChange={onChange}
                            disabled={busy || CtxDataLoading}
                            rows={6}
                        />
                    </FormField>

                    <div className="mem-form__actions">
                        {!isNew && (
                            <button
                                type="button"
                                className="modal__danger"
                                onClick={onDelete}
                                disabled={busy}
                            >
                                削除
                            </button>
                        )}

                        <button className="mem-btn mem-btn--ghost" type="button" onClick={close} disabled={busy}>
                            Cancel
                        </button>

                        <button className="mem-btn mem-btn--primary" type="submit" disabled={busy || CtxDataLoading}>
                            {busy ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
