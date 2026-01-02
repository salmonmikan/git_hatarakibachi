import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from '@src/utils/supabase.ts'
import '../admin_common.scss'

export default function Login() {
    const nav = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    return (
        <section className="admin" data-range="admin">
            <div className="admin-card" data-tone="paper">
                <h2 className="admin-site">hatarakibachi.com</h2>
                <h1 className="admin-title">Admin Login</h1>
                <p className="admin-desc">
                    管理者により発行されたログイン情報を入力してください。(Supabase Auth)
                </p>

                <form
                    className="admin-form"
                    data-busy={busy ? "true" : "false"}
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setBusy(true);
                        setError(null);

                        const { error } = await supabase.auth.signInWithPassword({ email, password });
                        setPassword("");

                        if (error) {
                            setError(error.message);
                            setBusy(false);
                            return;
                        }

                        nav("/", { replace: true });
                        setBusy(false);
                    }}
                >
                    <label className="field" data-kind="email">
                        <span className="field__label">Email</span>
                        <input
                            className="field__input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                            disabled={busy}
                        />
                    </label>

                    <label className="field" data-kind="password">
                        <span className="field__label">Password</span>
                        <input
                            className="field__input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            required
                            disabled={busy}
                        />
                    </label>

                    {error && <div className="form-error" role="alert">{error}</div>}

                    <button className="btn" data-variant="ghost" disabled={busy} type="submit">
                        {busy ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </section>
    );
}
