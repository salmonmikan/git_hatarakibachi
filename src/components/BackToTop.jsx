import React, { useEffect, useState, useCallback } from "react";
import "./BackToTop.scss";

/**
 * 右下に表示する「TOP」ボタン（JSX + SCSS）。
 * - スクロール量が threshold を超えたら表示
 * - クリックでスムーススクロール（対応ブラウザで）
 * - SSR 環境でも安全に動くように window ガード
 */
const BackToTop = ({ threshold = 200, label = "TOP", className = "" }) => {
    const [visible, setVisible] = useState(false);

    const check = useCallback(() => {
        if (typeof window === "undefined") return;
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        setVisible(y > threshold);
    }, [threshold]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        // 初期判定
        check();
        // スクロール監視（パッシブ）
        const onScroll = () => check();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [check]);

    const scrollTop = () => {
        if (typeof window === "undefined") return;
        try {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
            // 古いブラウザ向けフォールバック
            window.scrollTo(0, 0);
        }
    };

    return (
        <button
            type="button"
            aria-label="ページの先頭へ戻る"
            title="ページの先頭へ戻る"
            className={`back-to-top ${visible ? "is-visible" : ""} ${className}`}
            onClick={scrollTop}
        >
            {label}
        </button>
    );
};

export default BackToTop;