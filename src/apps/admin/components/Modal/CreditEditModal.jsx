// src/admin/pages/CreditEditModal.jsx
import FormField from "../FormField.jsx";
import { useAdminCtx } from "../../hooks/useAdminCtx.js";
import EntityEditModal from "../EntityEditModal.jsx";

import "./AdminEditModal.scss";

const CREDIT_DEFAULTS = {
    credit_title: "",
    credit_role: "",
    credit_date: "",
    member_id: "",
};

const CREDIT_COERCE = {
    member_id: (v) => Number(v),
    credit_title: (v) => String(v ?? "").trim(),
    credit_role: (v) => String(v ?? "").trim(),
    credit_date: (v) => (v ? v : null),
};

export default function CreditEditModal() {
    const { lists } = useAdminCtx();
    const { data: members, loading: membersLoading } = lists.members;

    return (
        <EntityEditModal
            list={lists.credits}
            entityName="Credit"
            defaults={CREDIT_DEFAULTS}
            coerce={CREDIT_COERCE}
            extras={{ members, membersLoading }}
            renderFields={({ form, onChange, busy, loading, extras }) => (
                <>
                    <FormField label="relational member *必須">
                        <select
                            name="member_id"
                            className="mem-form__input"
                            value={String(form.member_id ?? "")}
                            onChange={onChange}
                            disabled={busy || loading || extras.membersLoading}
                            required
                        >
                            <option value="" disabled>メンバーを選択…</option>
                            {(extras.members ?? []).map((m) => (
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
                            name="credit_date"
                            className="mem-form__input"
                            value={form.credit_date || ""}
                            onChange={onChange}
                            disabled={busy || loading}
                        />
                    </FormField>
                </>
            )}
        />
    );
}
