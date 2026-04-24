// src/admin/pages/MemberEditModal.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormField from "../FormField.jsx";
import { useAdminCtx } from "../../hooks/useAdminCtx.js";
import EntityEditModal from "../EntityEditModal.jsx";
import supabase from "@src/utils/supabase.ts";
import { uploadMemberImage } from "@src/utils/memberImageUpload.js";
import { returnPhotoUrl } from "@src/assets/_returnPhotoUrl.js";

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
    affiliation_code: "",
    state_flag: "",
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
    affiliation_code: (v) => String(v ?? "").trim(),
    state_flag: (v) => String(v ?? "").trim(),
};

const STATE_OPTIONS = [
    { value: 1, label: "1: 表示" },
    { value: 8, label: "8: 非表示" },
    // { value: 9, label: "9: 保留" },
];

const IMAGE_FIELDS = [
    {
        name: "photoUrl",
        label: "画像URL_バストアップ",
        description: "画像を選ぶと、保存時にSupabase Storageへアップロードして公開URLを自動反映します。",
    },
    {
        name: "photoUrl_2",
        label: "画像URL_顔写真",
        description: "画像を選ぶと、保存時にSupabase Storageへアップロードして公開URLを自動反映します。",
    },
];

function createFieldState(initialValue) {
    return IMAGE_FIELDS.reduce((acc, field) => {
        acc[field.name] = initialValue;
        return acc;
    }, {});
}

export default function MemberEditModal() {
    const { id } = useParams();
    const { lists } = useAdminCtx();
    const [selectedFiles, setSelectedFiles] = useState(() => createFieldState(null));
    const [objectUrls, setObjectUrls] = useState(() => createFieldState(""));
    const [fileInputKeys, setFileInputKeys] = useState(() => createFieldState(0));

    useEffect(() => {
        setSelectedFiles(createFieldState(null));
        setObjectUrls((prev) => {
            Object.values(prev).forEach((url) => {
                if (url) URL.revokeObjectURL(url);
            });
            return createFieldState("");
        });
        setFileInputKeys((prev) => {
            const next = {};
            for (const field of IMAGE_FIELDS) {
                next[field.name] = (prev[field.name] ?? 0) + 1;
            }
            return next;
        });
    }, [id]);

    useEffect(() => {
        return () => {
            Object.values(objectUrls).forEach((url) => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [objectUrls]);

    const setSelectedFile = (fieldName, file) => {
        setSelectedFiles((prev) => ({ ...prev, [fieldName]: file }));
        setObjectUrls((prev) => ({
            ...prev,
            [fieldName]: file ? URL.createObjectURL(file) : "",
        }));
    };

    const clearSelectedFile = (fieldName) => {
        setSelectedFiles((prev) => ({ ...prev, [fieldName]: null }));
        setObjectUrls((prev) => ({ ...prev, [fieldName]: "" }));
        setFileInputKeys((prev) => ({ ...prev, [fieldName]: (prev[fieldName] ?? 0) + 1 }));
    };

    const preparePayload = async (payload) => {
        const nextPayload = { ...payload };

        for (const field of IMAGE_FIELDS) {
            const file = selectedFiles[field.name];
            if (!file) continue;

            const { publicUrl } = await uploadMemberImage({
                supabase,
                file,
                fieldName: field.name,
            });
            nextPayload[field.name] = publicUrl;
        }

        return nextPayload;
    };

    return (
        <EntityEditModal
            list={lists.members}
            entityName="Member"
            defaults={MEMBER_DEFAULTS}
            coerce={MEMBER_COERCE}
            preparePayload={preparePayload}
            renderFields={({ form, onChange, busy, loading }) => (
                <>
                    <FormField label="名前 *必須">
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

                    {IMAGE_FIELDS.map((field) => {
                        const selectedFile = selectedFiles[field.name];
                        const previewSrc = objectUrls[field.name]
                            || (form[field.name] ? returnPhotoUrl(form[field.name], 320, "top") : "");

                        return (
                            <FormField key={field.name} label={field.label}>
                                <div className="mem-upload">
                                    <input
                                        name={field.name}
                                        className="mem-form__input"
                                        value={form[field.name]}
                                        onChange={onChange}
                                        disabled={busy || loading}
                                        placeholder="https://..."
                                    />

                                    <div className="mem-upload__row">
                                        <input
                                            key={fileInputKeys[field.name]}
                                            className="mem-form__file"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setSelectedFile(field.name, e.target.files?.[0] ?? null)}
                                            disabled={busy || loading}
                                        />
                                        {selectedFile && (
                                            <button
                                                type="button"
                                                className="mem-btn mem-btn--ghost mem-upload__clear"
                                                onClick={() => clearSelectedFile(field.name)}
                                                disabled={busy || loading}
                                            >
                                                選択を解除
                                            </button>
                                        )}
                                    </div>

                                    <p className="mem-upload__hint">{field.description}</p>

                                    {selectedFile && (
                                        <div className="mem-upload__meta">
                                            選択中: {selectedFile.name}
                                        </div>
                                    )}

                                    {!selectedFile && form[field.name] && (
                                        <a
                                            className="mem-upload__link"
                                            href={returnPhotoUrl(form[field.name], 800, "top")}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            現在の画像を開く
                                        </a>
                                    )}

                                    {previewSrc && (
                                        <img
                                            className="mem-upload__preview"
                                            src={previewSrc}
                                            alt={`${field.label} preview`}
                                        />
                                    )}
                                </div>
                            </FormField>
                        );
                    })}

                    <FormField label="所属 *必須">
                        <select
                            name="affiliation_code"
                            className="mem-form__input"
                            value={String(form.affiliation_code ?? "")}
                            onChange={onChange}
                            disabled={busy || loading}
                            required
                        >
                            <option value="" disabled>選択してください</option>
                            {(lists.master.members_affiliation.data ?? []).map((option) => (
                                <option key={option.code} value={option.code}>{option.label}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="メンバー状態フラグ *必須">
                        <select
                            name="state_flag"
                            className="mem-form__input"
                            value={String(form.state_flag ?? "")}
                            onChange={onChange}
                            disabled={busy || loading}
                            required
                        >
                            <option value="" disabled>選択してください</option>
                            {STATE_OPTIONS.map((option) => (
                                <option key={option.value} value={String(option.value)}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </FormField>
                </>
            )}
        />
    );
}
