// src/admin/pages/MemberEditModal.jsx
import FormField from "../FormField.jsx";
import { useAdminCtx } from "../../hooks/useAdminCtx.js";
import EntityEditModal from "../EntityEditModal.jsx";

import "./AdminEditModal.scss";

const MEMBER_DEFAULTS = {
    name: "",
    hurigana: "",
    bio: "",
    role: "",
    skill: "",
    hobby: "",
    photoUrl: "",
    photoUrl_2: "",
};

const MEMBER_COERCE = {
    name: (v) => String(v ?? "").trim(),
    hurigana: (v) => String(v ?? "").trim(),
    bio: (v) => String(v ?? "").trim(),
    role: (v) => String(v ?? "").trim(),
    skill: (v) => String(v ?? "").trim(),
    hobby: (v) => String(v ?? "").trim(),
    photoUrl: (v) => String(v ?? "").trim(),
    photoUrl_2: (v) => String(v ?? "").trim(),
};

export default function MemberEditModal() {
    const { lists } = useAdminCtx();

    return (
        <EntityEditModal
            list={lists.members}
            entityName="Member"
            defaults={MEMBER_DEFAULTS}
            coerce={MEMBER_COERCE}
            renderFields={({ form, onChange, busy, loading }) => (
                <>
                    <FormField label="名前">
                        <input
                            name="name"
                            className="mem-form__input"
                            value={form.name}
                            onChange={onChange}
                            disabled={busy || loading}
                            required
                        />
                    </FormField>

                    <FormField label="フリガナ(ローマ字)">
                        <input
                            name="hurigana"
                            className="mem-form__input"
                            value={form.hurigana}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>

                    <FormField label="一言">
                        <textarea
                            name="bio"
                            className="mem-form__textarea"
                            value={form.bio}
                            onChange={onChange}
                            disabled={busy || loading}
                            rows={6}
                        />
                    </FormField>

                    <FormField label="役職">
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
                    </FormField>

                    <FormField label="画像URL_バストアップ *画像の直接アップロードはできません">
                        <input
                            name="photoUrl"
                            className="mem-form__input"
                            value={form.photoUrl}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>

                    <FormField label="画像URL_顔写真 *画像の直接アップロードはできません">
                        <input
                            name="photoUrl_2"
                            className="mem-form__input"
                            value={form.photoUrl_2}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>
                </>
            )}
        />
    );
}
