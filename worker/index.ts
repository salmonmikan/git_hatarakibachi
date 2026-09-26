import { onRequestGet as disableDraft } from "../functions/api/disable-draft";
import { onRequestGet as draft } from "../functions/api/draft";
import { onRequestGet as webMembers } from "../functions/api/web-members";
import { onRequestGet as webSiteNews } from "../functions/api/web-sitenews";
import { onRequestGet as imageProxy } from "../functions/img/[[path]].js";
import { hasPreviewCookie, withPreviewHeaders } from "../functions/_preview";
import { isGetLikeMethod, resolveWorkerRoute } from "./routes.js";

type AssetBinding = {
  fetch(request: Request): Promise<Response>;
};

type Env = {
  ASSETS: AssetBinding;
  IMG_ORIGIN?: string;
  SANITY_PREVIEW_SECRET?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

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

async function runFunctionRoute(request: Request, env: Env, route: FunctionRoute) {
  if (!isGetLikeMethod(request.method)) {
    return methodNotAllowed();
  }

  let response: Response;

  switch (route.id) {
    case "draft":
      response = await draft({ request, env });
      break;
    case "disable-draft":
      response = await disableDraft({ request });
      break;
    case "web-members":
      response = await webMembers({ env });
      break;
    case "web-sitenews":
      response = await webSiteNews({ request });
      break;
    case "image-proxy":
      response = await imageProxy({
        env,
        params: route.params,
      });
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

async function handleRequest(request: Request, env: Env) {
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
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await handleRequest(request, env);
    return applyPreviewMiddleware(request, response);
  },
};
