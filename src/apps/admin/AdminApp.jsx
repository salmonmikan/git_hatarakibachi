import { useEffect, useState } from "react";
import supabase from '@/utils/supabase.ts'

// import NewsAdmin from "./NewsAdmin";

export default function AdminApp() {
  const [loading, setLoading] = useState(true);
  const [sessionEmail, setSessionEmail] = useState(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSessionEmail(data?.session?.user?.email ?? null);
      setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  if (!sessionEmail) {
    return (
      <div style={{ padding: 24, maxWidth: 420 }}>
        <h1>Admin Login</h1>
        <p style={{ opacity: 0.7, marginTop: 8 }}>
          Supabase Authでログイン（メール+パスワード想定）
        </p>
        <LoginForm />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Admin</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ opacity: 0.7 }}>{sessionEmail}</span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <hr style={{ margin: "16px 0" }} />

      {/* <NewsAdmin /> */}
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);

        setBusy(false);
      }}
      style={{ display: "grid", gap: 12, marginTop: 16 }}
    >
      <label style={{ display: "grid", gap: 6 }}>
        <span>Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Password</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
      </label>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <button disabled={busy} type="submit">
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}