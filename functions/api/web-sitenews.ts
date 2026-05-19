import { createClient } from "@sanity/client"
import type { FunctionContext } from "../_types"

interface SanityNews {
    _id: string
    id: string
    title: string
    publishedAt: string
    slug: string
    hasBody: boolean
}

interface NewsPayload {
    id: string
    title: string
    publishedAt: string
    url: string | null
    hasBody: boolean
}

export const onRequestGet = async ({ request }: Pick<FunctionContext, "request">) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit") ?? "100")
    const dataset =
        url.hostname === "staging.hatarakibachi.com" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "localhost"
            ? "staging"
            : "production"
    const client = createClient({
        projectId: "pz9uficf",
        dataset,
        useCdn: true,
        apiVersion: "2023-05-03",
    })

    const query = `*[_type == "news" && status == "published"] | order(coalesce(publishedAt, _updatedAt) desc)[0...$limit]{
        "_id": _id,
        "id": _id,
        title,
        publishedAt,
        "slug": slug.current,
        "hasBody": defined(body[0])
    }`

    const result = await client.fetch<SanityNews[]>(query, { limit })
    const payload = (result ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        publishedAt: item.publishedAt,
        url: item.hasBody ? `/news/${item.slug}` : null,
        hasBody: item.hasBody,
    }))

    return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300",
        },
    })
}
