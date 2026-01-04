import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useCallback, useState } from "react";
import supabase from '@src/utils/supabase.ts'

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

    const refreshMembers = useCallback(async () => {
        setListLoading("members", true);
        setListError("members", null);

        const res = await supabase
            .from("members")
            .select("*")
            .order("id", { ascending: true })
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

    const refreshCredits = useCallback(async () => {
        setListLoading("credits", true);
        setListError("credits", null);

        const res = await supabase
            .from("credits")
            .select("*")
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
                members: { ...lists.members, refresh: refreshMembers },
                news: { ...lists.news, refresh: refreshNews },
                credits: { ...lists.credits, refresh: refreshCredits },
            },
            setLists,
        };
    }, [lists, refreshMembers, refreshNews, refreshCredits]);

    return (
        <div className="admin-shell" data-surface="app">
            {!dashboard && `hatarakibashi Admin`}
            {/* ここに管理画面の共通ヘッダー/サイドバーを置いてOK */}
            <Outlet context={ctx} />
            {!dashboard &&
                <button className="admin-members__button" type="button" onClick={back}>
                    back
                </button>
            }
        </div>
    );
}
