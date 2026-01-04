

export default function ListShell({ loading, hasItems, children }) {
    return (
        <div className="adm-list" data-loading={loading ? "true" : "false"}>
            {loading ? (
                <div className="adm-list__placeholder" data-tone="muted">…</div>
            ) : !hasItems ? (
                <div className="adm-list__placeholder" data-tone="muted">No items</div>
            ) : (
                children
            )}
        </div>
    );
}
