import { handleDisableDraft } from "./handlers/disable-draft";
import { handleDraft } from "./handlers/draft";
import { handleImageProxy } from "./handlers/image-proxy";
import { handleWebMembers } from "./handlers/web-members";
import { handleWebSiteNews } from "./handlers/web-sitenews";
import { hasPreviewCookie, withPreviewHeaders } from "./preview";
import { isGetLikeMethod, resolveWorkerRoute } from "./routes.js";
import type { WorkerEnv } from "./types";

type FunctionRoute = {
  kind: "function";
  id: string;
  params: Record<string, unknown>;
};

function methodNotAllowed() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, HEAD" },
  });
}

function apiNotFound() {
  return new Response("Not Found", { status: 404 });
}

function withoutBodyForHead(request: Request, response: Response) {
  if (request.method !== "HEAD") return response;

  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function runFunctionRoute(
  request: Request,
  env: WorkerEnv,
  route: FunctionRoute,
) {
  if (!isGetLikeMethod(request.method)) {
    return methodNotAllowed();
  }

  let response: Response;

  switch (route.id) {
    case "draft":
      response = await handleDraft(request, env);
      break;
    case "disable-draft":
      response = await handleDisableDraft(request);
      break;
    case "web-members":
      response = await handleWebMembers(env);
      break;
    case "web-sitenews":
      response = await handleWebSiteNews(request);
      break;
    case "image-proxy":
      response = await handleImageProxy(
        env,
        Array.isArray(route.params.path)
          ? route.params.path.filter((item): item is string => typeof item === "string")
          : [],
      );
      break;
    case "img-url-disabled":
      response = apiNotFound();
      break;
    default:
      response = apiNotFound();
  }

  return withoutBodyForHead(request, response);
}

function applyPreviewMiddleware(request: Request, response: Response) {
  if (!hasPreviewCookie(request)) {
    return response;
  }

  const headers = withPreviewHeaders(new Headers(response.headers));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handleRequest(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const route = resolveWorkerRoute(url.pathname);

  if (route.kind === "function") {
    return runFunctionRoute(request, env, route);
  }

  if (route.kind === "api-not-found") {
    return apiNotFound();
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const response = await handleRequest(request, env);
    return applyPreviewMiddleware(request, response);
  },
};
