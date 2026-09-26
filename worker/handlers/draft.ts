import {
  createPreviewCookie,
  getSafeRedirect,
  withPreviewHeaders,
} from "../preview";
import type { WorkerEnv } from "../types";

export async function handleDraft(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!env.SANITY_PREVIEW_SECRET || secret !== env.SANITY_PREVIEW_SECRET) {
    return new Response("Invalid preview secret", {
      status: 401,
      headers: withPreviewHeaders(),
    });
  }

  const headers = withPreviewHeaders();
  headers.set("Set-Cookie", createPreviewCookie(request));
  headers.set("Location", getSafeRedirect(request));

  return new Response(null, {
    status: 307,
    headers,
  });
}
