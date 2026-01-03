import { Outlet } from "react-router-dom";
import { useEffect, useMemo, useCallback, useState } from "react";
import supabase from '@src/utils/supabase.ts'

export default function AdminLayout() {
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [membersError, setMembersError] = useState(null);

    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [newsError, setNewsError] = useState(null);

    const refreshMembers = useCallback(async () => {
        setMembersLoading(true);
        setMembersError(null);

        const res = await supabase
            .from("members")
            .select("*")
            .order("id", { ascending: true })
            .limit(5000);

        if (res.error) {
            setMembersError(res.error.message);
            setMembers([]);
            setMembersLoading(false);
            return;
        }

        setMembers(res.data ?? []);
        setMembersLoading(false);
    }, []);

    const refreshNews = useCallback(async () => {
        setNewsLoading(true);
        setNewsError(null);

        const res = await supabase
            .from("site_news")
            .select("id,news_title,news_status,published_at")
            .order("published_at", { ascending: false })
            .limit(200);

        if (res.error) {
            setNewsError(res.error.message);
            setNews([]);
            setNewsLoading(false);
            return;
        }

        setNews(res.data ?? []);
        setNewsLoading(false);
    }, []);

    useEffect(() => {
        let alive = true;

        (async () => {
            await Promise.all([refreshMembers(), refreshNews()]);
            if (!alive) return;
        })();

        return () => {
            alive = false;
        };
    }, [refreshMembers, refreshNews]);

    const ctx = useMemo(
        () => ({
            members,
            membersLoading,
            membersError,
            refreshMembers,

            news,
            newsLoading,
            newsError,
            refreshNews,
        }),
        [
            members,
            membersLoading,
            membersError,
            refreshMembers,
            news,
            newsLoading,
            newsError,
            refreshNews,
        ]
    );

    return (
        <div className="admin-shell" data-surface="app">
            {/* ここに管理画面の共通ヘッダー/サイドバーを置いてOK */}
            <Outlet context={ctx} />
        </div>
    );
}
