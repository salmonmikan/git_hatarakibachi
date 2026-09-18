const GET_ROUTES = new Map([
  ["/api/draft", "draft"],
  ["/api/disable-draft", "disable-draft"],
  ["/api/web-members", "web-members"],
  ["/api/web-sitenews", "web-sitenews"],
  ["/api/img-url", "img-url-disabled"],
]);

function decodePathSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function normalizePathname(pathname) {
  if (pathname.length <= 1) return pathname;
  return pathname.replace(/\/+$/, "");
}

export function resolveWorkerRoute(pathname) {
  const normalizedPathname = normalizePathname(pathname);
  const routeId = GET_ROUTES.get(normalizedPathname);
  if (routeId) {
    return { kind: "function", id: routeId, params: {} };
  }

  if (normalizedPathname === "/img" || normalizedPathname.startsWith("/img/")) {
    const raw = normalizedPathname === "/img" ? "" : normalizedPathname.slice("/img/".length);
    const path = raw
      .split("/")
      .filter(Boolean)
      .map(decodePathSegment);

    return {
      kind: "function",
      id: "image-proxy",
      params: { path },
    };
  }

  if (normalizedPathname === "/api" || normalizedPathname.startsWith("/api/")) {
    return { kind: "api-not-found" };
  }

  return { kind: "asset" };
}

export function isGetLikeMethod(method) {
  return method === "GET" || method === "HEAD";
}
