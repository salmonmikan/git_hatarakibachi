import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from '@src/utils/supabase.ts'

export default function RequireAuth({ children }) {
    const [loading, setLoading] = useState(true);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        let alive = true;

        supabase.auth.getSession().then(({ data }) => {
            if (!alive) return;
            setAuthed(!!data.session);
            setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
            setAuthed(!!session);
        });

        return () => {
            alive = false;
            sub?.subscription?.unsubscribe?.();
        };
    }, []);

    if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
    if (!authed) return <Navigate to="/login" replace />;

    return children;
}
