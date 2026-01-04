import { Link } from "react-router-dom";

function MetricCard({ to, label, value, loading }) {
    const Card = (
        <>
            <div className="adm-card__label">{label}</div>
            <div className="adm-card__value" data-loading={loading ? "true" : "false"}>
                {loading ? "…" : value}
            </div>
        </>
    );

    // to があれば Link、なければ div
    return to ? (
        <Link to={to} className="adm-card" data-surface="paper" data-kind="metric">
            {Card}
        </Link>
    ) : (
        <div className="adm-card" data-surface="paper" data-kind="metric">
            {Card}
        </div>
    );
}

export default function MetricGrid({ items = [] }) {
    return (
        <div className="adm-cards" data-layout="grid" data-cols="auto-fit">
            {items.map((it) => (
                <MetricCard
                    key={it.key ?? it.label}
                    to={it.to}
                    label={it.label}
                    value={it.value}
                    loading={it.loading}
                />
            ))}
        </div>
    );
}
