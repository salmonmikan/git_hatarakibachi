import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from '@src/utils/supabase.ts'

export default function Login() {
    const nav = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                padding: 18,
                background: "#fafafa",
            }}
        >
            <div style={{ width: "100%", maxWidth: 420, background: "white", border: "1px solid #eee", borderRadius: 12, padding: 18 }}>
                <h2 style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>hatarakibachi.com</h2>
                <h1 style={{ margin: "6px 0 0" }}>Admin Login</h1>
                <p style={{ opacity: 0.7, marginTop: 8 }}>
                    Supabase Auth（メール+パスワード）
                </p>

                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setBusy(true);
                        setError(null);

                        const { error } = await supabase.auth.signInWithPassword({ email, password });
                        setPassword(""); // 送信後は消す

                        if (error) {
                            setError(error.message);
                            setBusy(false);
                            return;
                        }

                        nav("/", { replace: true });
                        setBusy(false);
                    }}
                    style={{ display: "grid", gap: 12, marginTop: 14 }}
                >
                    <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 13, opacity: 0.8 }}>Email</span>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                            disabled={busy}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                        />
                    </label>

                    <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 13, opacity: 0.8 }}>Password</span>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            required
                            disabled={busy}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                        />
                    </label>

                    {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}

                    <button
                        disabled={busy}
                        type="submit"
                        style={{
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            cursor: busy ? "not-allowed" : "pointer",
                        }}
                    >
                        {busy ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
