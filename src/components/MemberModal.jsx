// git_hatarakibachi/src/components/MemberModal.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import "./MemberModal.scss";
import { returnPhotoUrl } from "../assets/_returnPhotoUrl";

const MotionDiv = motion.div;

function present(value) {
    return value != null && String(value).trim() !== "";
}

export default function MemberModal({ open, member, onClose, photoUrl }) {
    const backdropRef = useRef(null);
    const closeBtnRef = useRef(null);

    // Esc で閉じる & スクロールロック
    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };

        document.addEventListener("keydown", onKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        // 初期フォーカス
        setTimeout(() => closeBtnRef.current?.focus(), 0);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open || typeof document === "undefined") return null;

    // 値のあるなし判定
    const detailItems = member
        ? [
            { key: "age", label: "年齢：", value: member.age != null ? `${member.age}歳` : "非公開" },
            { key: "height", label: "身長：", value: member.height != null ? `${member.height}cm` : "非公開" },
            { key: "birthplace", label: "出身地：", value: member.birthplace || "非公開" },
            { key: "join_year", label: "入団：", value: member.join_year != null ? `${member.join_year}` : null },
            { key: "hobby", label: "趣味：", value: member.hobby?.length ? member.hobby : null },
            { key: "skill", label: "特技：", value: member.skill?.length ? member.skill : null },
            // { key: "personal_history", label: "出演歴：", value: member.personal_history?.length ? member.personal_history : null },
        ].filter((item) => present(item.value))
        : [];

    const creditYears = Object.keys(member?.creditsByYear ?? {}).sort((a, b) => Number(b) - Number(a));

    const content = (
        <AnimatePresence>
            {open && (
                // ★ バックドロップにフェード
                <MotionDiv
                    ref={backdropRef}
                    className="modal-backdrop"
                    onClick={(e) => {
                        if (e.target === backdropRef.current) onClose?.();
                    }}
                    role="presentation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    {/* ★ パネルに軽いフェード＆ズーム（好みで y を 8px 程度） */}
                    <MotionDiv
                        className="modal-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="メンバー詳細"
                        initial={{ opacity: 0, scale: 0.98, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 8 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                        {member && (
                            <div className="modal-content modal-layout">
                                <div className="modal-main">
                                    {photoUrl ? (
                                        <img
                                            className="modal-photo upper"
                                            loading="lazy"
                                            src={returnPhotoUrl(photoUrl, 400, "top")}
                                            alt={member.name}
                                        />
                                    ) : (
                                        <div className="member-photo-placeholder modal-photo" aria-hidden="true" />
                                    )}

                                    <div className="modal-header">
                                        <h2 className="modal-name">{member.name}</h2>
                                        <span>{member.hurigana}</span>
                                    </div>

                                    <p className="modal-role">{member.role}</p>

                                    {present(member.bio) && <p className="modal-bio">{member.bio}</p>}

                                    {/* <h3>基本情報</h3> */}
                                    <div className="modal-details">
                                        {detailItems.map((item) => (
                                            <p key={item.key} className="modal-detail">
                                                <span className="label">{item.label}</span>
                                                <span className="value">{item.value}</span>
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-history">
                                    <h3>活動歴</h3>
                                    {creditYears.map((year) => (
                                        <section className="modal-credit_year" key={year}>
                                            <h4>{year}年</h4>
                                            {member.creditsByYear[year].map((credit) => (
                                                <div key={credit.id}>
                                                    <div>{credit.credit_title}</div>
                                                    <div>{` -- ${credit.credit_role}`}</div>
                                                </div>
                                            ))}
                                        </section>
                                    ))}
                                </div>
                            </div>
                        )}
                    </MotionDiv>

                    <button
                        className="modal-close"
                        onClick={onClose}
                        ref={closeBtnRef}
                        aria-label="閉じる"
                    >
                        ×
                    </button>
                </MotionDiv>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
}

MemberModal.propTypes = {
    open: PropTypes.bool.isRequired,
    member: PropTypes.shape({
        age: PropTypes.number,
        bio: PropTypes.string,
        birthplace: PropTypes.string,
        creditsByYear: PropTypes.object,
        hobby: PropTypes.string,
        hurigana: PropTypes.string,
        height: PropTypes.number,
        join_year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        name: PropTypes.string,
        photoAlt: PropTypes.string,
        photoUrl: PropTypes.string,
        role: PropTypes.string,
        skill: PropTypes.string,
    }),
    onClose: PropTypes.func,
    photoUrl: PropTypes.string,
};
