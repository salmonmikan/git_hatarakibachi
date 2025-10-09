// components/MemberPhoto.jsx


// Cloudflare Image Resizing のURL生成ユーティリティ
function cfResize(
    originUrl,
    { width, height, fit = "cover", format = "auto", quality = 85 } = {}
) {
    const params = [
        width ? `width=${width}` : null,
        height ? `height=${height}` : null,
        fit && `fit=${fit}`,
        format && `format=${format}`,
        quality && `quality=${quality}`,
    ]
        .filter(Boolean)
        .join(",");
    // const k_env = env.IMG_KEY

    // 同一ドメイン配信なら絶対URLを渡すのが無難
    // return `/cdn-cgi/image/${params}/${originUrl}`;
    return `${originUrl}`;
}

// 画像表示コンポーネント
export default function MemberPhoto({
    src,           // member.photoUrl（R2公開URLなど）
    alt = "",
    w = 400,
    h = 400,
    className = "member-photo",
    fallbackText = "No Image",
    fit = "cover",
    quality = 85,
}) {
    if (!src) {
        return (
            <div
                className={className}
                style={{
                    width: w,
                    height: h,
                    display: "grid",
                    placeItems: "center",
                    background: "#f3f4f6",
                    color: "#6b7280",
                    borderRadius: 8,
                }}
            >
                {fallbackText}
            </div>
        );
    }

    const url = cfResize(src, {
        width: w,
        height: h,
        fit,
        format: "auto",
        quality,
    });

    return (
        <img
            src={url}
            alt={alt}
            width={w}
            height={h}
            className={className}
            loading="lazy"
            decoding="async"
            style={{ objectFit: "cover", borderRadius: 8 }}
        />
    );
}
