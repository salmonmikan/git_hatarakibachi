// // functions/api/img-url.js
// export const onRequestGet = async ({ request, env }) => {
//     const url = new URL(request.url);
//     const path = url.searchParams.get("path");
//     if (!path) return new Response("path required", { status: 400 });

//     // 生成するURLは img-worker のルールに合わせる（ここでは ?k=...）
//     const origin = (env.IMG_ORIGIN || "https://img.hoge.com").replace(/\/+$/, "");
//     const final = `${origin}/${encodeURI(path)}?k=${encodeURIComponent(env.IMG_KEY)}`;

//     // （任意）短寿命を作るならここで署名(exp+sig)するロジックに差し替え
//     return new Response(JSON.stringify({ url: final }), {
//         headers: { "Content-Type": "application/json" },
//     });
// };
