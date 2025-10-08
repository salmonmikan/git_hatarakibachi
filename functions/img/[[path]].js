// functions/img/[[path]].js
export const onRequestGet = async ({ env, params }) => {
    const key = params.path || ""; // 例: "member/tachibana_body.jpg"
    if (!key) return new Response("Not Found", { status: 404 });

    const origin = env.IMG_ORIGIN; // 例: https://img.hatarakibachi.com
    const url = new URL(`${origin.replace(/\/+$/, "")}/${key}`);
    url.searchParams.set("k", env.IMG_KEY);

    const r = await fetch(url, {
        cf: { cacheEverything: true, cacheTtl: 3600 },
        headers: { "User-Agent": "Pages-Proxy" },
    });
    if (!r.ok) return new Response(r.statusText, { status: r.status });

    const res = new Response(r.body, r);
    res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return res;
};
