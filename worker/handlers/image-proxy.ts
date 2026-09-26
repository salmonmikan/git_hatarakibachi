import type { WorkerEnv } from "../types";

export async function handleImageProxy(env: WorkerEnv, path: string[]) {
  if (path.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  if (!env.IMG_ORIGIN || !env.IMG_KEY) {
    return new Response("Image proxy is not configured", { status: 503 });
  }

  const origin = env.IMG_ORIGIN.replace(/\/+$/, "");
  const key = path.map((part) => encodeURIComponent(part)).join("/");
  const url = new URL(`${origin}/${key}`);
  url.searchParams.set("k", env.IMG_KEY);

  const upstream = await fetch(url, {
    cf: {
      cacheEverything: true,
      cacheTtl: 3600,
    },
    headers: {
      "User-Agent": "Workers-Proxy",
    },
  });

  if (!upstream.ok) {
    return new Response(upstream.statusText, { status: upstream.status });
  }

  const response = new Response(upstream.body, upstream);
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
