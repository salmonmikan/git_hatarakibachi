export default function AnalyticsEmbed() {
    const src =
        "https://lookerstudio.google.com/embed/reporting/ca879983-cb09-49ff-aaf3-4a7e379cae9c/page/fFEkF";

    return (
        <div style={{ width: "100%", height: "calc(100vh - 120px)" }}>
            <iframe
                title="Analytics Dashboard"
                src={src}
                style={{ width: "100%", height: "100%", border: 0 }}
                loading="lazy"
                allowFullScreen
            />
        </div>
    );
}
