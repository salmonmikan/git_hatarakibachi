// src/admin/components/EntityEditModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EntityEditModal({
    list,                 // lists.xxx
    entityName = "Item",
    defaults = {},        // フォーム初期値 (新規/空)
    coerce = {},          // payload整形 (保存時)
    parseId = (id) => Number(id),
    renderFields,         // ({form,onChange,busy,loading,isNew,extras}) => JSX
    renderActions,        // 任意
    extras = {},
}) {
    const nav = useNavigate();
    const { id } = useParams();

    const isNew = id === "new";
    const entityId = isNew ? null : parseId(id);

    const { data, loading, error, refresh, add, update, remove } = list;

    const entity = useMemo(() => {
        if (isNew) return null;
        return (data ?? []).find((x) => x.id === entityId) ?? null;
    }, [data, entityId, isNew]);

    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [form, setForm] = useState(() => ({ ...defaults })); // ←共有参照を避ける

    const onClose = () => nav("..", { replace: true });

    // ESC/背景クリック/スクロール止め
    useEffect(() => {
        const onKeyDown = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKeyDown);

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prev;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 編集時：defaults を土台に entity を流し込む（null/undefined は defaults に落とす）
    useEffect(() => {
        if (!entity) return;

        const next = { ...defaults };
        for (const key of Object.keys(defaults)) {
            const v = entity[key];
            next[key] = v === null || v === undefined ? defaults[key] : v;
        }
        setForm(next);
    }, [entity?.id]); // entity切替時だけ

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const buildPayload = (f) => {
        const payload = { ...f };

        // coerceが指定されてるキーだけ変換
        for (const [k, fn] of Object.entries(coerce)) {
            payload[k] = fn(payload[k], payload);
        }

        // よくある事故防止：空文字だけ残したくない場合に備えてそのまま返す
        return payload;
    };

    const onSave = async (e) => {
        e.preventDefault();
        setBusy(true);
        setLocalError(null);

        const payload = buildPayload(form);
        const res = isNew ? await add(payload) : await update(entityId, payload);

        if (res?.error) {
            setLocalError(res.error.message ?? "保存に失敗しました。");
            setBusy(false);
            return;
        }

        await refresh?.();
        setBusy(false);
        onClose();
    };

    const onDelete = async () => {
        if (isNew || !Number.isFinite(entityId)) return;
        if (!window.confirm("削除しますか？")) return;

        setBusy(true);
        setLocalError(null);

        const res = await remove(entityId);
        if (res?.error) {
            setLocalError(res.error.message ?? "削除に失敗しました。");
            setBusy(false);
            return;
        }

        await refresh?.();
        setBusy(false);
        onClose();
    };

    return (
        <div className="mem-modal" role="presentation" onClick={onClose} data-busy={busy} data-loading={loading}>
            <div className="mem-modal__panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <header className="mem-modal__header">
                    <div>
                        <h2 className="mem-modal__title">{isNew ? `Add ${entityName}` : `Edit ${entityName}`}</h2>
                        <div className="mem-modal__sub">id: {id}</div>
                    </div>
                    <button className="mem-modal__close" onClick={onClose} disabled={busy}>Close</button>
                </header>

                {loading && <div className="mem-modal__hint">Loading...</div>}

                {(localError || error) && (
                    <div className="mem-modal__error">
                        <div className="mem-modal__errorTitle">Error</div>
                        <div className="mem-modal__errorBody">{String(localError || error)}</div>
                    </div>
                )}

                <form className="mem-form" onSubmit={onSave}>
                    {renderFields({ form, onChange, busy, loading, isNew, extras })}

                    {renderActions ? (
                        renderActions({ busy, loading, isNew, onDelete, onClose })
                    ) : (
                        <div className="mem-form__actions">
                            {!isNew && (
                                <button type="button" className="modal__danger" onClick={onDelete} disabled={busy}>
                                    削除
                                </button>
                            )}
                            <button className="mem-btn mem-btn--ghost" type="button" onClick={onClose} disabled={busy}>
                                Cancel
                            </button>
                            <button className="mem-btn mem-btn--primary" type="submit" disabled={busy || loading}>
                                {busy ? "Saving..." : "Save"}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
