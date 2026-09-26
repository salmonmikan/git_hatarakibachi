import {
  clearPreviewCookie,
  getSafeRedirect,
  withPreviewHeaders,
} from "../preview";

export async function handleDisableDraft(request: Request) {
  const headers = withPreviewHeaders();
  headers.set("Set-Cookie", clearPreviewCookie(request));
  headers.set("Location", getSafeRedirect(request));

  return new Response(null, {
    status: 307,
    headers,
  });
}
