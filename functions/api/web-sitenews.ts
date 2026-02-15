// import type { PagesFunction } from "@cloudflare/workers-types"
// import { Response } from "@cloudflare/workers-types"

type Env = {
    SUPABASE_URL: string
    SUPABASE_ANON_KEY: string
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
    const select = `*`

    const qs = new URLSearchParams({
        select,
        // "deleted_at": "is.null",
        "news_status": "eq.1",
        order: "id.asc",
    })

    const url = `${env.SUPABASE_URL}/rest/v1/site_news?${qs.toString()}`

    const res = await fetch(url, {
        headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
    })

    // Supabase側エラーをそのまま返す（デバッグしやすい）
    const body = await res.text()
    return new Response(body, {
        status: res.status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300",
        },
    })
}
