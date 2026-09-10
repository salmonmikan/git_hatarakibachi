import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { pageVariants, pageTransition } from "@src/assets/_pageVariants.js";
import "./MemberFeeRegistration.scss";

function PageMotion({ children, onEntered }) {
    const reduce = useReducedMotion();
    return (
        <motion.section
            className="page member-fee-page"
            initial={reduce ? false : "initial"}
            animate="enter"
            exit="exit"
            variants={pageVariants}
            transition={reduce ? { duration: 0 } : pageTransition}
            onAnimationComplete={() => {
                if (typeof onEntered === "function") onEntered();
            }}
        >
            {children}
        </motion.section>
    );
}

export default function MemberFeeRegistration({ onEntered }) {
    const { token = "" } = useParams();
    const [registration, setRegistration] = useState(null);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;

        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await fetch(`/api/member-fee/registration?token=${encodeURIComponent(token)}`, {
                    headers: { Accept: "application/json" },
                });
                const body = await response.json();
                if (!response.ok) throw new Error(body.error || "登録情報を確認できませんでした。");
                if (alive) setRegistration(body);
            } catch (loadError) {
                if (alive) setError(loadError instanceof Error ? loadError.message : "登録情報を確認できませんでした。");
            } finally {
                if (alive) setLoading(false);
            }
        };

        load();
        return () => {
            alive = false;
        };
    }, [token]);

    const onSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setError("");
        try {
            const response = await fetch("/api/member-fee/registration", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ token, email }),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "決済ページを作成できませんでした。");
            if (!body.url) throw new Error("決済ページのURLを取得できませんでした。");
            window.location.assign(body.url);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "決済ページを作成できませんでした。");
            setSubmitting(false);
        }
    };

    return (
        <PageMotion onEntered={onEntered}>
            <section className="member-fee-card" aria-labelledby="member-fee-title">
                <p className="member-fee-card__eyebrow">Member Fee</p>
                <h2 id="member-fee-title">劇団はたらきばち 団員費</h2>

                {loading && <p>登録情報を確認しています。</p>}

                {!loading && registration && (
                    <>
                        <p className="member-fee-card__member">{registration.memberName} さん</p>
                        <dl className="member-fee-summary">
                            <div>
                                <dt>団員費</dt>
                                <dd>月額 1,000円</dd>
                            </div>
                            <div>
                                <dt>決済</dt>
                                <dd>Squareによる定期決済</dd>
                            </div>
                        </dl>

                        {registration.registered ? (
                            <p className="member-fee-notice">この団員はすでに定期決済へ登録されています。</p>
                        ) : (
                            <form className="member-fee-form" onSubmit={onSubmit}>
                                <label htmlFor="member-fee-email">決済に使用するメールアドレス</label>
                                <input
                                    id="member-fee-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                    disabled={submitting}
                                />
                                <p className="member-fee-form__hint">
                                    次の画面からSquareの決済ページへ移動します。カード情報は劇団サイトでは保持しません。
                                </p>
                                <button type="submit" disabled={submitting}>
                                    {submitting ? "決済ページを準備中..." : "Squareで定期決済を登録する"}
                                </button>
                            </form>
                        )}
                    </>
                )}

                {error && <p className="member-fee-error" role="alert">{error}</p>}
            </section>
        </PageMotion>
    );
}

export function MemberFeeComplete({ onEntered }) {
    return (
        <PageMotion onEntered={onEntered}>
            <section className="member-fee-card" aria-labelledby="member-fee-complete-title">
                <p className="member-fee-card__eyebrow">Member Fee</p>
                <h2 id="member-fee-complete-title">団員費の登録を受け付けました</h2>
                <p>
                    Squareでの手続き内容は劇団の管理画面へ自動で反映されます。決済に関する確認が必要な場合は劇団運営へご連絡ください。
                </p>
            </section>
        </PageMotion>
    );
}
