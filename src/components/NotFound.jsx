import { useNavigate } from "react-router-dom";

export default function NotFound() {
    const nav = useNavigate();
    const back = () => nav("/", { replace: true });

    return (
        <div style={{ padding: 24 }}>
            <h1>404 Not Found...🍯</h1>
            <p style={{ opacity: 0.7 }}>ページが見つかりませんでした。</p>
            <button type="button" onClick={back}>
                トップページに戻る
            </button>
        </div>
    );
}