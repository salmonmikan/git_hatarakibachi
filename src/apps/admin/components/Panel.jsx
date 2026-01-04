// Panel.jsx
export default function Panel({
    title,
    meta,
    kind,
    children,
    surface = "paper",
    headRight, // 右側にボタン置きたい時用（任意）
}) {
    return (
        <section className="adm-panel" data-surface={surface} data-kind={kind}>
            <div className="adm-panel__head" data-layout="row" data-justify="between">
                <h2 className="adm-panel__title">{title}</h2>

                {headRight ? (
                    headRight
                ) : meta ? (
                    <span className="adm-panel__meta" data-size="xs">
                        {meta}
                    </span>
                ) : null}
            </div>

            {children}
        </section>
    );
}

export function PanelSection({ title, children }) {
    return (
        <>
            <div className="adm-title">{title}</div>
            {children}
        </>
    );
}
