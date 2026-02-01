// src/admin/pages/MemberEditModal.jsx
import FormField from "../FormField.jsx";
import { useAdminCtx } from "../../hooks/useAdminCtx.js";
import EntityEditModal from "../EntityEditModal.jsx";

import "./AdminEditModal.scss";

const MEMBER_DEFAULTS = {
    news_title: "",
    news_summary: "",
    published_at: "",
    news_status: "5",
    // skill: "",
    // hobby: "",
    // photoUrl: "",
    // photoUrl_2: "",
    // state_flag: "",
};

const MEMBER_COERCE = {
    news_title: (v) => String(v ?? "").trim(),
    news_summary: (v) => String(v ?? "").trim(),
    published_at: (v) => (v ? v : null),
    news_status: (v) => String(v ?? "").trim(),
    // skill: (v) => String(v ?? "").trim(),
    // hobby: (v) => String(v ?? "").trim(),
    // photoUrl: (v) => String(v ?? "").trim(),
    // photoUrl_2: (v) => String(v ?? "").trim(),
    // state_flag: (v) => String(v ?? "").trim(),
};

const STATE_OPTIONS = [
    { value: 1, label: "1: 公開中" },
    { value: 5, label: "5: 下書き" },
    { value: 8, label: "8: 非公開" },
];

export default function NewsEditModal() {
    const { lists } = useAdminCtx();

    return (
        <EntityEditModal
            list={lists.news}
            entityName="News"
            defaults={MEMBER_DEFAULTS}
            coerce={MEMBER_COERCE}
            renderFields={({ form, onChange, busy, loading }) => (
                <>
                    <FormField label="ニュースタイトル">
                        <input
                            name="news_title"
                            className="mem-form__input"
                            value={form.news_title}
                            onChange={onChange}
                            disabled={busy || loading}
                            required
                        />
                    </FormField>

                    <FormField label="ニュース詳細 *web側表示には未対応です(実装予定)">
                        <textarea
                            name="news_summary"
                            className="mem-form__input"
                            value={form.news_summary}
                            onChange={onChange}
                            disabled={busy || loading}
                            rows={6}
                        />
                    </FormField>

                    {/* <FormField label="一言">
                        <textarea
                            name="bio"
                            className="mem-form__textarea"
                            value={form.bio}
                            onChange={onChange}
                            disabled={busy || loading}
                            rows={6}
                        />
                    </FormField> */}

                    <FormField label="ニュース発行日">
                        <input
                            type="date"
                            name="published_at"
                            className="mem-form__input"
                            value={form.published_at}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>

                    <FormField label="ニュース公開ステータス *デフォルトは「下書き」です">
                        <select
                            name="news_status"
                            className="mem-form__input"
                            value={String(form.news_status ?? "")}
                            onChange={onChange}
                            disabled={busy || loading}
                            required
                        >
                            <option value="" disabled>選択してください</option>
                            {STATE_OPTIONS.map((o) => (
                                <option key={o.value} value={String(o.value)}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    {/* <FormField label="趣味">
                        <input
                            name="hobby"
                            className="mem-form__input"
                            value={form.hobby}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>

                    <FormField label="画像URL_バストアップ *画像の直接アップロードはできません">
                        <input
                            name="photoUrl"
                            className="mem-form__input"
                            value={form.photoUrl}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField> */}
                </>
            )}
        />
    );
}
