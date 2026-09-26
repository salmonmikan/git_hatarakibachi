import type { WorkerEnv } from "../types";

export async function handleWebMembers(env: WorkerEnv) {
  const select = `
    *,
    credits:credits (
        id,
        credit_title,
        credit_role,
        credit_date,
        deleted_at
    )
    `.replace(/\s+/g, " ").trim();

  const qs = new URLSearchParams({
    select,
    deleted_at: "is.null",
    state_flag: "eq.1",
    "credits.deleted_at": "is.null",
    order: "display_order.asc",
  });

  const url = `${env.SUPABASE_URL}/rest/v1/members?${qs.toString()}`;
  const response = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
