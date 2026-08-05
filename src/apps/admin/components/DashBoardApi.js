import supabase from '@src/utils/supabase.ts'
import { getNewsStats, getRecentNews, getRecentPerformances } from '@src/utils/sanityFetch.js'


export async function fetchNewsStats() {
    const res = await getNewsStats();
    if (!res) return { ok: false, error: "Sanity news stats fetch failed" };
    return { ok: true, data: res };
}

export async function fetchRecentNews({ limit = 5 } = {}) {
    const res = await getRecentNews(limit);
    if (!res) return { ok: false, error: "Sanity recent news fetch failed" };
    return { ok: true, data: res ?? [] };
}

export async function fetchRecentPerformances({ limit = 5 } = {}) {
    const res = await getRecentPerformances(limit);
    if (!res) return { ok: false, error: "Sanity recent performances fetch failed" };
    return { ok: true, data: res ?? [] };
}

// export async function fetchRecentCredits({ limit = 100 } = {}) {
//     const res = await supabase
//         .from("credits")
//         .select("id, member_id, credit_title, credit_role, credit_date")
//         .order("credit_date", { ascending: false })
//         .limit(limit);

//     if (res.error) return { ok: false, error: res.error.message };
//     return { ok: true, data: res.data ?? [] };
// }

// export async function fetchMemberInfo({ limit = 50 } = {}) {
//     const res = await supabase
//         .from('members')
//         .select(`
//             *,
//             credits:credits (
//                 id,
//                 credit_title,
//                 credit_role,
//                 credit_date
//             )
//         `)
//         .order('id', { ascending: true })
//         .limit(limit);


//     if (res.error) return { ok: false, error: res.error.message };
//     return { ok: true, data: res.data ?? [] };
// }

export async function fetchUpdateInfo({ limit = 10 } = {}) {
    const res = await supabase
        .from("update_info")
        .select("*")
        .order("update_date", { ascending: false })
        .is("deleted_at", null)
        .limit(limit);


    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, data: res.data ?? [] };
}
