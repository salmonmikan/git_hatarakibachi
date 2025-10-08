// functions/img/[...path].js
export const onRequestGet = async ({ request, env, params }) => {
    // 例: /img/member/tachibana_body.jpg → "member/tachibana_body.jpg"
    const path = Array.isArray(params.path) ? params.path.join("/") : (params.path || "");
    if (!path) return new Response("Not Found", { status: 404 });

    // img-worker 側（R2非公開＋?k=必須）へ裏で取りに行く
    const origin = env.IMG_ORIGIN;  // 例: https://img.hatarakibachi.com
    const url = new URL(`${origin.replace(/\/+$/, "")}/${path}`);
    url.searchParams.set("k", env.IMG_KEY); // 共有キーを付与（フロントには露出しない）

    const r = await fetch(url, {
        cf: { cacheEverything: true, cacheTtl: 3600 },
        headers: { "User-Agent": "Pages-Proxy" },
    });
    if (!r.ok) return new Response(r.statusText, { status: r.status });

    // オリジンのヘッダを活かしつつ、キャッシュを強めに付与
    const res = new Response(r.body, r);
    res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return res;
};
