import supabase from '@src/utils/supabase.ts'


export async function fetchNewsStats({ limit = 5000 } = {}) {
    const res = await supabase.from("site_news").select("news_status").limit(limit);
    if (res.error) return { ok: false, error: res.error.message };

    const rows = res.data ?? [];
    const stats = { total: rows.length, draft: 0, public: 0, private: 0 };
    for (const r of rows) {
        if (r.news_status === 0) stats.draft += 1;
        else if (r.news_status === 1) stats.public += 1;
        else if (r.news_status === 2) stats.private += 1;
    }
    return { ok: true, data: stats };
}

export async function fetchRecentNews({ limit = 5 } = {}) {
    const res = await supabase
        .from("site_news")
        .select("id, news_title, news_status, published_at")
        .order("published_at", { ascending: false })
        .limit(limit);

    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, data: res.data ?? [] };
}

export async function fetchRecentCredits({ limit = 100 } = {}) {
    const res = await supabase
        .from("credits")
        .select("id, member_id, credit_title, credit_role, credit_date")
        .order("credit_date", { ascending: false })
        .limit(limit);

    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, data: res.data ?? [] };
}

export async function fetchMemberInfo({ limit = 50 } = {}) {
    const res = await supabase
        .from('members')
        .select(`
            *,
            credits:credits (
                id,
                credit_title,
                credit_role,
                credit_date
            )
        `)
        .order('id', { ascending: true })
        .limit(limit);


    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, data: res.data ?? [] };
}
