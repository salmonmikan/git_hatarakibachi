// functions/img/[[path]].js


export const onRequestGet = async ({ env, params }) => {
    console.log(params);
    const raw = params.path || ""; // 例: "member/tachibana_body.jpg"
    if (!raw) return new Response("Not Found", { status: 404 });

    const origin = env.IMG_ORIGIN; // 例: https://img.hatarakibachi.com
    // normalize: array -> "a/b/c", string -> as-is
    const parts = Array.isArray(raw) ? raw : String(raw).split("/").filter(Boolean);
    // encode each segment, then join with '/'
    const key = parts.map(p => encodeURIComponent(p)).join("/");

    const url = new URL(`${origin}/${key}`);
    url.searchParams.set("k", "uhe89K89g2S4h27");
    console.log(url.toString());

    const r = await fetch(url, {
        cf: { cacheEverything: true, cacheTtl: 3600 },
        headers: { "User-Agent": "Pages-Proxy" },
    });
    if (!r.ok) return new Response(r.statusText, { status: r.status });

    const res = new Response(r.body, r);
    res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return res;
};
