import React, { useEffect, useState } from "react";
import "./FloatingLinks.scss";

const Icon = ({ name }) => {
    if (name === "x") {
        return (
            <svg className="fl-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 5.5L19 19.5M19 5.5L3 19.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (name === "instagram") {
        return (
            <svg className="fl-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <path d="M16 11.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="18.2" cy="6.8" r="0.8" fill="currentColor" />
            </svg>
        );
    }
    if (name === "mail") {
        return (
            <svg className="fl-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 7.5v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 7.5l-9 6-9-6" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    return null;
};

export default function FloatingLinks({
    behavior = "fixed", // "fixed" or "sticky" (fixed is typical)
}) {
    const [open, setOpen] = useState(false);

    // close when clicking outside
    useEffect(() => {
        if (!open) return;
        function onDoc(e) {
            if (!e.target.closest?.(".floating-links")) setOpen(false);
        }
        document.addEventListener("pointerdown", onDoc);
        return () => document.removeEventListener("pointerdown", onDoc);
    }, [open]);

    // change these URLs to your actual handles
    const links = [
        { key: "x", label: "X", to: "https://x.com/hatarakibachi88act", icon: "x" },
        { key: "ig", label: "Instagram", to: "https://www.instagram.com/hatarakibachi88act", icon: "instagram" },
        { key: "mail", label: "Email", to: "mailto:hatarakibachi88act@gmail.com", icon: "mail" },
    ];

    return (
        <div
            className={[
                "floating-links",
                behavior === "sticky" ? "is-sticky" : "is-fixed",
                open ? "is-open" : "",
            ].join(" ")}
        >
            <button
                className="floating-toggle"
                aria-expanded={open}
                aria-controls="floating-links-list"
                onClick={() => setOpen(s => !s)}
                title={open ? "閉じる" : "リンクを開く"}
            >
                ≡
            </button>

            <ul id="floating-links-list" className="floating-list" role="menu" aria-hidden={!open && window.matchMedia?.("(hover: none) and (pointer: coarse)").matches}>
                {links.map(l => {
                    const isExternal = /^https?:\/\//i.test(l.to) || /^mailto:/i.test(l.to);
                    return (
                        <li key={l.key} className="floating-item" role="none">
                            <a
                                role="menuitem"
                                className="floating-link"
                                href={l.to}
                                target={isExternal && !l.to.startsWith("mailto:") ? "_blank" : "_self"}
                                rel={isExternal && !l.to.startsWith("mailto:") ? "noopener noreferrer" : undefined}
                                onClick={() => setOpen(false)}
                                aria-label={l.label}
                            >
                                <Icon name={l.icon} />
                                <span className="floating-label">{l.label}</span>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
