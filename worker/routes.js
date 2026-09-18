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

export function resolveWorkerRoute(pathname) {
  const routeId = GET_ROUTES.get(pathname);
  if (routeId) {
    return { kind: "function", id: routeId, params: {} };
  }

  if (pathname === "/img" || pathname.startsWith("/img/")) {
    const raw = pathname === "/img" ? "" : pathname.slice("/img/".length);
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

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return { kind: "api-not-found" };
  }

  return { kind: "asset" };
}

export function isGetLikeMethod(method) {
  return method === "GET" || method === "HEAD";
}
