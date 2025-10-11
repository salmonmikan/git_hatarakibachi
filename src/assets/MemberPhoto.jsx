// components/MemberPhoto.jsx
import React from "react";

/**
 * MemberPhoto
 *
 * - 単一コンポーネント内に URL 生成ロジックを内包（func を分けない）
 * - Cloudflare Image Resizing を使う場合は useCloudflare=true にすることで
 *   /cdn-cgi/image/.../https://... の形で URL を作る
 * - トリミング位置は `gravity`（サーバ側）と `focus`（CSS の objectPosition）で組み合わせて扱う
 *
 * Props:
 *  - src: 画像元 URL（必須ではない）
 *  - width, height: 表示幅・高さ（数値 / px）
 *  - fit: "cover" | "contain" | "scale-down" | "fill"（デフォルト: "cover"）
 *  - gravity: サーバ側の重心指定（"center","north","south","east","west","northwest"...）
 *  - focus: { x: number, y: number } 0-100 のパーセントで CSS object-position を指定（任意）
 *  - useCloudflare: true のとき Cloudflare 形式で URL を生成（デフォルト false）
 *  - quality, format: (拡張用) サーバ側パラメータ
 *  - alt, className, fallbackText, style, ...rest
 */
export default function MemberPhoto({
    src,
    width = 300,
    height = 300,
    fit = "scale-down",
    gravity, // "center", "north", "south", "east", "west", "northeast", "southeast", "southwest", "northwest"
    focus, // { x: 50, y: 50 } のような百分率指定
    useCloudflare = false,
    // quality = 100,
    // format = "auto",
    alt = "",
    className = "member-photo",
    fallbackText = "No Image",
    style = {},
    ...rest
}) {
    // --- 内部ユーティリティ（コンポーネント内に閉じる） ---
    const buildCfUrl = (originUrl) => {
        if (!originUrl) return originUrl;
        // Cloudflare のパラメータ群を組み立てる（必要に応じてここを拡張）
        const parts = [];
        if (Number.isFinite(width)) parts.push(`width=${Math.round(width)}`);
        if (Number.isFinite(height)) parts.push(`height=${Math.round(height)}`);
        // if (fit) parts.push(`fit=${encodeURIComponent(fit)}`);
        if (gravity) parts.push(`gravity=${encodeURIComponent(gravity)}`);
        // if (format) parts.push(`format=${encodeURIComponent(format)}`);
        // if (quality) parts.push(`quality=${Math.round(quality)}`);

        const params = parts.join(",");
        // Cloudflare は絶対 URL を受け取れるため、次の形が使える:
        // /cdn-cgi/image/{params}/{absolute-or-relative-url}
        // originUrl が相対パスならそのまま、絶対パスならそのまま挿入する
        // 注意: 実運用では originUrl のエンコード等を検討してください
        // https://img.hatarakibachi.com/cdn-cgi/image/width=150,height=150,fit=cover/img/member/tachibana_body.jpg
        return `https://img.hatarakibachi.com/cdn-cgi/image/${params}/${originUrl}`;
    };

    // CSS 用 objectPosition の文字列を作る
    const cssObjectPosition = (() => {
        if (!focus || typeof focus.x !== "number" || typeof focus.y !== "number") {
            // gravity のキーワードがあるならそれを優先して使う
            // ただし objectPosition では center/north/south などそのまま使える
            return gravity || "center";
        }
        // focus.x/y は 0-100 の想定 -> "xx% yy%"
        const clamp = (v) => Math.max(0, Math.min(100, v));
        return `${clamp(focus.x)}% ${clamp(focus.y)}%`;
    })();

    // Fallback（画像が無いとき）表示
    if (!src) {
        return (
            <div
                className={className}
                style={{
                    width,
                    height,
                    display: "grid",
                    placeItems: "center",
                    background: "#f3f4f6",
                    color: "#6b7280",
                    borderRadius: 20,
                    fontSize: 14,
                    ...style,
                }}
            >
                {fallbackText}
            </div>
        );
    }

    // 最終 URL を決める（Cloudflare を使うかどうか）
    const finalUrl = useCloudflare ? buildCfUrl(src) : src;

    // スタイル：objectFit は fit と一致。細かい表示位置は objectPosition で制御
    const imgStyle = {
        width: typeof width === "number" ? width : width,
        height: typeof height === "number" ? height : height,
        objectFit: fit,
        objectPosition: cssObjectPosition,
        borderRadius: 20,
        display: "block",
        ...style,
    };

    // accessibility: alt を可能な限り入れる
    return (
        <img
            src={finalUrl}
            width={width}
            height={height}
            alt={alt || fallbackText}
            className={className}
            loading="lazy"
            decoding="async"
            style={imgStyle}
            {...rest}
        />
    );
}
