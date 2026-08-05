let lastTrackedPagePath = null;

export function resolvePageType(pathname = "/") {
    if (pathname === "/") return "home";
    if (pathname === "/about") return "about";
    if (pathname === "/member") return "member";
    if (pathname === "/stage") return "stage";
    if (pathname === "/scenario") return "scenario";
    if (pathname === "/contact") return "contact";
    if (pathname.startsWith("/post/")) return "post_detail";
    if (pathname.startsWith("/performance/")) return "performance_detail";
    if (pathname.startsWith("/news/")) return "news_detail";
    return "not_found";
}

export function trackPageView({ pathname, title }) {
    if (typeof window === "undefined") return;
    if (!pathname || lastTrackedPagePath === pathname) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: "page_view_custom",
        page_path: pathname,
        page_title: title || document.title || "",
        page_type: resolvePageType(pathname),
    });

    lastTrackedPagePath = pathname;
}

export function trackDataLayerEvent(event, parameters = {}) {
    if (typeof window === "undefined" || !event) return;

    const pathname = window.location.pathname || "/";
    const payload = Object.fromEntries(
        Object.entries({
            page_path: pathname,
            page_type: resolvePageType(pathname),
            ...parameters,
        }).filter(([, value]) => value !== undefined && value !== null),
    );

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        ...payload,
        event,
    });
}
