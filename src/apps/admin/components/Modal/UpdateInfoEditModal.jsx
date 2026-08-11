import FormField from "../FormField.jsx";
import { useAdminCtx } from "../../hooks/useAdminCtx.js";
import EntityEditModal from "../EntityEditModal.jsx";

import "./AdminEditModal.scss";

const DEFAULTS = {
    update_date: new Date().toISOString().split('T')[0],
    update_title: "",
    update_description: "",
    categories: "", // カンマ区切りの文字列として扱う（入力時）
};

const COERCE = {
    update_title: (v) => String(v ?? "").trim(),
    update_description: (v) => String(v ?? "").trim(),
    update_date: (v) => (v ? v : null),
    categories: (v) => {
        if (Array.isArray(v)) return v;
        return String(v ?? "").split(",").map(s => s.trim()).filter(Boolean);
    },
};

export default function UpdateInfoEditModal() {
    const { lists } = useAdminCtx();

    // 編集時に配列をカンマ区切り文字列に戻すための変換
    const parseEntity = (entity) => {
        if (!entity) return DEFAULTS;
        return {
            ...entity,
            categories: Array.isArray(entity.categories) ? entity.categories.join(", ") : (entity.categories ?? ""),
        };
    };

    return (
        <EntityEditModal
            list={lists.updates}
            entityName="Update Info"
            defaults={DEFAULTS}
            coerce={COERCE}
            renderFields={({ form, onChange, busy, loading }) => (
                <>
                    <FormField label="更新日">
                        <input
                            type="date"
                            name="update_date"
                            className="mem-form__input"
                            value={form.update_date}
                            onChange={onChange}
                            disabled={busy || loading}
                            required
                        />
                    </FormField>

                    <FormField label="タイトル">
                        <input
                            name="update_title"
                            className="mem-form__input"
                            value={form.update_title}
                            onChange={onChange}
                            disabled={busy || loading}
                            required
                        />
                    </FormField>

                    <FormField label="詳細内容">
                        <textarea
                            name="update_description"
                            className="mem-form__input"
                            value={form.update_description}
                            onChange={onChange}
                            disabled={busy || loading}
                            rows={6}
                        />
                    </FormField>

                    <FormField label="カテゴリ (カンマ区切り)">
                        <input
                            name="categories"
                            className="mem-form__input"
                            placeholder="例: パフォーマンス, バグ修正"
                            value={form.categories}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>
                </>
            )}
        />
    );
}
