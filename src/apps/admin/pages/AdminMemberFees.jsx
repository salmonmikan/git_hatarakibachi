import { useEffect, useMemo, useState } from "react";
import supabase from "@src/utils/supabase.ts";
import "./admin_view.scss";
import "./AdminMemberFees.scss";

const SUBSCRIPTION_STATUS_LABELS = {
    NOT_REGISTERED: "未登録",
    PENDING: "登録中",
    ACTIVE: "有効",
    PAUSED: "休止中",
    CANCELED: "解約済み",
    DEACTIVATED: "無効",
};

const PAYMENT_STATUS_LABELS = {
    PAID: "入金済",
    PARTIAL: "一部入金",
    FAILED: "決済失敗",
};

function getCurrentMonth() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
    }).formatToParts(new Date());
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    return `${year}-${month}-01`;
}

function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(value));
}

function getPublicSiteOrigin() {
    const configured = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
    if (configured) return configured.replace(/\/$/, "");

    const url = new URL(window.location.origin);
    if (url.hostname.startsWith("admin.")) {
        url.hostname = url.hostname.slice("admin.".length);
    } else if (url.hostname.startsWith("admin-")) {
        url.hostname = url.hostname.slice("admin-".length);
    }
    return url.origin;
}

export default function AdminMemberFees() {
    const [billingRows, setBillingRows] = useState([]);
    const [payments, setPayments] = useState([]);
    const [webhookIssues, setWebhookIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copiedMemberId, setCopiedMemberId] = useState(null);
    const currentMonth = useMemo(() => getCurrentMonth(), []);

    useEffect(() => {
        let alive = true;

        const load = async () => {
            setLoading(true);
            setError("");

            const [billingResult, paymentsResult, webhookResult] = await Promise.all([
                supabase
                    .from("member_billing")
                    .select("*, member:members(id,name,deleted_at)")
                    .order("member_id", { ascending: true }),
                supabase
                    .from("member_fee_payments")
                    .select("*")
                    .order("target_month", { ascending: false })
                    .order("paid_at", { ascending: false }),
                supabase
                    .from("square_webhook_events")
                    .select("event_id,event_type,status,detail,received_at")
                    .in("status", ["unmatched", "error"])
                    .order("received_at", { ascending: false })
                    .limit(20),
            ]);

            if (!alive) return;
            const firstError = billingResult.error || paymentsResult.error || webhookResult.error;
            if (firstError) {
                setError(firstError.message);
                setLoading(false);
                return;
            }

            setBillingRows((billingResult.data ?? []).filter((row) => row.member && !row.member.deleted_at));
            setPayments(paymentsResult.data ?? []);
            setWebhookIssues(webhookResult.data ?? []);
            setLoading(false);
        };

        load();
        return () => {
            alive = false;
        };
    }, []);

    const paymentByMemberAndMonth = useMemo(() => {
        const map = new Map();
        for (const payment of payments) {
            map.set(`${payment.member_id}:${payment.target_month}`, payment);
        }
        return map;
    }, [payments]);

    const lastPaidPaymentByMember = useMemo(() => {
        const map = new Map();
        for (const payment of payments) {
            if (payment.status === "PAID" && !map.has(payment.member_id)) {
                map.set(payment.member_id, payment);
            }
        }
        return map;
    }, [payments]);

    const summary = useMemo(() => {
        const active = billingRows.filter((row) => row.subscription_status === "ACTIVE").length;
        const paid = billingRows.filter((row) => paymentByMemberAndMonth.get(`${row.member_id}:${currentMonth}`)?.status === "PAID").length;
        const failed = billingRows.filter((row) => paymentByMemberAndMonth.get(`${row.member_id}:${currentMonth}`)?.status === "FAILED").length;
        const waiting = billingRows.filter((row) => !row.square_subscription_id).length;
        return { active, paid, failed, waiting };
    }, [billingRows, currentMonth, paymentByMemberAndMonth]);

    const copyRegistrationLink = async (row) => {
        const link = `${getPublicSiteOrigin()}/member-fee/register/${row.registration_token}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopiedMemberId(row.member_id);
            window.setTimeout(() => setCopiedMemberId(null), 2000);
        } catch {
            setError("登録リンクをクリップボードへコピーできませんでした。");
        }
    };

    if (loading) return <div className="admin-view">Loading...</div>;

    return (
        <div className="admin-view member-fees-admin">
            <h1 className="admin-view__title">Manage Member Fees</h1>
            <p className="admin-view__hint">Squareの団員費定期決済と月別の入金状況を確認できます。</p>

            {error && (
                <div className="member-fees-alert" role="alert">
                    Error: {error}
                </div>
            )}

            <div className="member-fees-summary" aria-label="団員費サマリー">
                <div>
                    <span>有効な定期決済</span>
                    <strong>{summary.active}</strong>
                </div>
                <div>
                    <span>今月入金済</span>
                    <strong>{summary.paid}</strong>
                </div>
                <div>
                    <span>今月決済失敗</span>
                    <strong>{summary.failed}</strong>
                </div>
                <div>
                    <span>登録待ち</span>
                    <strong>{summary.waiting}</strong>
                </div>
            </div>

            {webhookIssues.length > 0 && (
                <section className="member-fees-issues" aria-labelledby="member-fee-webhook-issues">
                    <h2 id="member-fee-webhook-issues">Square連携の要確認イベント</h2>
                    <ul>
                        {webhookIssues.map((event) => (
                            <li key={event.event_id}>
                                <strong>{event.event_type}</strong>
                                <span>{event.status}</span>
                                <span>{event.detail || "詳細なし"}</span>
                                <time>{formatDate(event.received_at)}</time>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="member-fees-table-wrap">
                <table className="member-fees-table">
                    <thead>
                        <tr>
                            <th>団員</th>
                            <th>定期決済</th>
                            <th>今月</th>
                            <th>最終入金</th>
                            <th>決済メール</th>
                            <th>登録</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billingRows.map((row) => {
                            const currentPayment = paymentByMemberAndMonth.get(`${row.member_id}:${currentMonth}`);
                            const lastPaidPayment = lastPaidPaymentByMember.get(row.member_id);
                            const subscriptionLabel = SUBSCRIPTION_STATUS_LABELS[row.subscription_status] ?? row.subscription_status;
                            const paymentLabel = currentPayment
                                ? PAYMENT_STATUS_LABELS[currentPayment.status] ?? currentPayment.status
                                : row.square_subscription_id ? "未入金" : "未登録";
                            const registered = Boolean(row.square_subscription_id);

                            return (
                                <tr key={row.id}>
                                    <td className="member-fees-table__member">{row.member.name}</td>
                                    <td>{subscriptionLabel}</td>
                                    <td>{paymentLabel}</td>
                                    <td>{formatDate(lastPaidPayment?.paid_at)}</td>
                                    <td>{row.billing_email || "-"}</td>
                                    <td>
                                        <button
                                            className="admin-view__button"
                                            type="button"
                                            onClick={() => copyRegistrationLink(row)}
                                            disabled={registered}
                                            title={registered ? "すでにSquareへ登録済みです" : "団員専用の登録URLをコピー"}
                                        >
                                            {registered
                                                ? "登録済み"
                                                : copiedMemberId === row.member_id ? "コピー済み" : "登録リンクをコピー"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
