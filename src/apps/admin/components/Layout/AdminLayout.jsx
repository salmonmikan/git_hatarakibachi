import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useCallback, useState } from "react";
import supabase from '@src/utils/supabase.ts'
import BackToTop from "../../../../components/BackToTop";

const initialLists = {
    members: { data: [], loading: true, error: null },
    news: { data: [], loading: true, error: null },
    credits: { data: [], loading: true, error: null },
};

export default function AdminLayout() {
    // listでまとめて管理
    const [lists, setLists] = useState(initialLists);

    const nav = useNavigate();
    const back = () => nav("/", { replace: true });
    const dashboard = window.location.pathname === "/";

    // 1,prev（今のlists）を受け取る.全体は ...prev でコピー（members/news/credits を全取得）
    // 2,そのうち key（例 "members"）だけを...prev[key] で中身（data/errorなど）を保ったままloading だけ上書き
    const setListLoading = useCallback((key, loading) => {
        setLists((prev) => ({
            ...prev,
            [key]: { ...prev[key], loading },
        }));
    }, []);

    // errorだけ上書き
    const setListError = useCallback((key, error) => {
        setLists((prev) => ({
            ...prev,
            [key]: { ...prev[key], error },
        }));
    }, []);

    // dataだけ上書き
    const setListData = useCallback((key, data) => {
        setLists((prev) => ({
            ...prev,
            [key]: { ...prev[key], data },
        }));
    }, []);

    const refreshNews = useCallback(async () => {
        setListLoading("news", true);
        setListError("news", null);

        const res = await supabase
            .from("site_news")
            .select("id,news_title,news_status,published_at")
            .order("published_at", { ascending: false })
            .limit(200);

        if (res.error) {
            setListError("news", res.error.message);
            setListData("news", []);
            setListLoading("news", false);
            return;
        }

        setListData("news", res.data ?? []);
        setListLoading("news", false);
    }, [setListLoading, setListError, setListData]);


    const addNews = useCallback(
        async (payload) => {
            setListLoading("news", true);
            setListError("news", null);

            const res = await supabase
                .from("site_news")
                .insert(payload)
                .select("*")
                .single();

            if (res.error) {
                setListError("news", res.error.message);
                setListLoading("news", false);
                return { data: null, error: res.error };
            }

            setLists((prev) => {
                const next = [...(prev.news.data ?? []), res.data].sort((a, b) => a.id - b.id);
                return { ...prev, news: { ...prev.news, data: next } };
            });

            setListLoading("news", false);
            return { data: res.data, error: null };
        },
        [setListLoading, setListError, setLists]
    );

    const updateNews = useCallback(
        async (id, payload) => {
            setListLoading("news", true);
            setListError("news", null);

            const res = await supabase
                .from("site_news")
                .update(payload)
                .eq("id", id)
                .select("*")
                .single();

            if (res.error) {
                setListError("news", res.error.message);
                setListLoading("news", false);
                return { data: null, error: res.error };
            }

            setLists((prev) => {
                const next = (prev.news.data ?? []).map((c) => (c.id === id ? res.data : c));
                return { ...prev, news: { ...prev.news, data: next } };
            });

            setListLoading("news", false);
            return { data: res.data, error: null };
        },
        [setListLoading, setListError, setLists]
    );

    const removeNews = useCallback(
        async (id) => {
            setListLoading("news", true);
            setListError("news", null);

            const res = await supabase
                .from("site_news")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", id)
                .select("id")
                .single();

            if (res.error) {
                setListError("news", res.error.message);
                setListLoading("news", false);
                return { data: null, error: res.error };
            }

            setLists((prev) => {
                const next = (prev.news.data ?? []).filter((c) => c.id !== id);
                return { ...prev, news: { ...prev.news, data: next } };
            });

            setListLoading("news", false);
            return { data: { id }, error: null };
        },
        [setListLoading, setListError, setLists]
    );
    

    // creditAPI
    const refreshCredits = useCallback(async () => {
        setListLoading("credits", true);
        setListError("credits", null);

        const res = await supabase
            .from("credits")
            .select(`
                *,
                member:members ( id, name )
            `)
            .is("deleted_at", null)
            .order("id", { ascending: true })
            .limit(5000);

        if (res.error) {
            setListError("credits", res.error.message);
            setListData("credits", []);
            setListLoading("credits", false);
            return;
        }

        setListData("credits", res.data ?? []);
        setListLoading("credits", false);
    }, [setListLoading, setListError, setListData]);

    const addCredit = useCallback(
        async (payload) => {
            setListLoading("credits", true);
            setListError("credits", null);

            const res = await supabase
                .from("credits")
                .insert(payload)
                .select("*")
                .single();

            if (res.error) {
                setListError("credits", res.error.message);
                setListLoading("credits", false);
                return { data: null, error: res.error };
            }

            setLists((prev) => {
                const next = [...(prev.credits.data ?? []), res.data].sort((a, b) => a.id - b.id);
                return { ...prev, credits: { ...prev.credits, data: next } };
            });

            setListLoading("credits", false);
            return { data: res.data, error: null };
        },
        [setListLoading, setListError, setLists]
    );

    const updateCredit = useCallback(
        async (id, payload) => {
            setListLoading("credits", true);
            setListError("credits", null);

            const res = await supabase
                .from("credits")
                .update(payload)
                .eq("id", id)
                .select("*")
                .single();

            if (res.error) {
                setListError("credits", res.error.message);
                setListLoading("credits", false);
                return { data: null, error: res.error };
            }

            setLists((prev) => {
                const next = (prev.credits.data ?? []).map((c) => (c.id === id ? res.data : c));
                return { ...prev, credits: { ...prev.credits, data: next } };
            });

            setListLoading("credits", false);
            return { data: res.data, error: null };
        },
        [setListLoading, setListError, setLists]
    );

    const removeCredit = useCallback(
        async (id) => {
            setListLoading("credits", true);
            setListError("credits", null);

            const res = await supabase
                .from("credits")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", id)
                .select("id")
                .single();

            if (res.error) {
                setListError("credits", res.error.message);
                setListLoading("credits", false);
                return { data: null, error: res.error };
            }

            setLists((prev) => {
                const next = (prev.credits.data ?? []).filter((c) => c.id !== id);
                return { ...prev, credits: { ...prev.credits, data: next } };
            });

            setListLoading("credits", false);
            return { data: { id }, error: null };
        },
        [setListLoading, setListError, setLists]
    );

    // memberAPI
    const refreshMembers = useCallback(async () => {
        setListLoading("members", true);
        setListError("members", null);

        const res = await supabase
            .from("members")
            .select("*")
            .order("id", { ascending: true })
            .is("deleted_at", null)
            .limit(5000);

        if (res.error) {
            setListError("members", res.error.message);
            setListData("members", []);
            setListLoading("members", false);
            return;
        }

        setListData("members", res.data ?? []);
        setListLoading("members", false);
    }, [setListLoading, setListError, setListData]);

    const addMembers = useCallback(
        async (payload) => {
            setListLoading("members", true);
            setListError("members", null);

            const res = await supabase
                .from("members")
                .insert(payload)
                // .select("*")
                .single();

            if (res.error) {
                setListError("members", res.error.message);
                setListLoading("members", false);
                return { data: null, error: res.error };
            }

            // setLists((prev) => {
            //     const next = [...(prev.members.data ?? []), res.data].sort((a, b) => a.id - b.id);
            //     return { ...prev, members: { ...prev.members, data: next } };
            // });

            setListLoading("members", false);
            return { data: res.data, error: null };
        },
        [setListLoading, setListError, setLists]
    );

    const updateMembers = useCallback(
        async (id, payload) => {
            setListLoading("members", true);
            setListError("members", null);

            const res = await supabase
                .from("members")
                .update(payload)
                .eq("id", id)
                .select("*")
                .single();

            if (res.error) {
                setListError("members", res.error.message);
                setListLoading("members", false);
                return { data: null, error: res.error };
            }

            setLists((prev) => {
                const next = (prev.members.data ?? []).map((c) => (c.id === id ? res.data : c));
                return { ...prev, members: { ...prev.members, data: next } };
            });

            setListLoading("members", false);
            return { data: res.data, error: null };
        },
        [setListLoading, setListError, setLists]
    );

    const removeMembers = useCallback(
        async (id) => {
            setListLoading("members", true);
            setListError("members", null);

            const res = await supabase
                .from("members")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", id)
                .select("id")
                .single();

            if (res.error) {
                setListError("members", res.error.message);
                setListLoading("members", false);
                return { data: null, error: res.error };
            }

            setLists((prev) => {
                const next = (prev.members.data ?? []).filter((c) => c.id !== id);
                return { ...prev, members: { ...prev.members, data: next } };
            });

            setListLoading("members", false);
            return { data: { id }, error: null };
        },
        [setListLoading, setListError, setLists]
    );


    // 一斉取得
    useEffect(() => {
        let alive = true;

        (async () => {
            await Promise.all([refreshMembers(), refreshNews(), refreshCredits()]);
            if (!alive) return;
        })();

        return () => {
            alive = false;
        };
    }, [refreshMembers, refreshNews, refreshCredits]);

    const ctx = useMemo(() => {
        // AdminLayout の ctx に lists を入れて Outlet context={ctx} してるから、子側で useAdminCtx()（= useOutletContext() 的なやつ）経由で取れる。
        return {
            // 集約版（これを使うと増えても1箇所）
            lists: {
                // refresh関数も集約する
                members: {
                    ...lists.members, 
                    refresh: refreshMembers,
                    add: addMembers,
                    update: updateMembers,
                    remove: removeMembers, 
                },
                news: { 
                    ...lists.news,
                    refresh: refreshNews,
                    add: addNews,
                    update: updateNews,
                    remove: removeNews,
                },
                credits: {
                    ...lists.credits,
                    refresh: refreshCredits,
                    add: addCredit,
                    update: updateCredit,
                    remove: removeCredit,
                },
            },
            setLists,
        };
    }, [lists]);

    return (
        <div className="admin-shell" data-surface="app">
            {!dashboard && `hatarakibachi Admin`}
            {/* ここに管理画面の共通ヘッダー/サイドバーを置いてOK */}
            <Outlet context={ctx} />
            {!dashboard &&
                <button className="admin-members__button" type="button" onClick={back}>
                    back
                </button>
            }
            <BackToTop />
        </div>
    );
}
