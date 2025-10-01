// git_hatarakibachi/src/components/MemberModal.jsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './MemberModal.scss';

export default function MemberModal({ open, member, onClose }) {
    const backdropRef = useRef(null);
    const closeBtnRef = useRef(null);

    // Esc で閉じる & スクロールロック
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // 初期フォーカス
        setTimeout(() => closeBtnRef.current?.focus(), 0);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open) return null;
    if (typeof document === 'undefined') return null;

    // const handleBackdropClick = (e) => {
    //     if (e.target === backdropRef.current) onClose?.();
    // };

    const content = (
        <AnimatePresence>
            {open && (
                // ★ バックドロップにフェード
                <motion.div
                    ref={backdropRef}
                    className="modal-backdrop"
                    onClick={(e) => { if (e.target === backdropRef.current) onClose?.(); }}
                    role="presentation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                    {/* ★ パネルに軽いフェード＆ズーム（好みで y を 8px 程度） */}
                    <motion.div
                        className="modal-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="メンバー詳細"
                        initial={{ opacity: 0, scale: 0.98, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                        <button
                            className="modal-close"
                            onClick={onClose}
                            ref={closeBtnRef}
                            aria-label="閉じる"
                        >
                            ×
                        </button>

                        {member && (
                            <div className="modal-content">
                                {member.photoUrl ? (
                                    <img className="modal-photo" src={member.photoUrl} alt={member.photoAlt || `${member.name}の写真`} />
                                ) : (
                                    <div className="member-photo-placeholder modal-photo" aria-hidden="true" />
                                )}
                                <h2 className="modal-name">{member.name}</h2>
                                <p className="modal-role">{member.role}</p>
                                {member.bio && <p className="modal-bio">{member.bio}</p>}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
}

MemberModal.propTypes = {
    open: PropTypes.bool.isRequired,
    member: PropTypes.shape({
        name: PropTypes.string,
        role: PropTypes.string,
        bio: PropTypes.string,
        photoUrl: PropTypes.string,
        photoAlt: PropTypes.string,
    }),
    onClose: PropTypes.func,
};
