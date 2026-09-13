let lastTrackedPagePath = null;

const MEMBER_FEE_REGISTER_PATH = "/member-fee/register";

export function normalizeAnalyticsPath(pathname = "/") {
    if (!pathname) return "/";
    if (pathname === MEMBER_FEE_REGISTER_PATH) return MEMBER_FEE_REGISTER_PATH;
    return pathname;
}

export function resolvePageType(pathname = "/") {
    const safePath = normalizeAnalyticsPath(pathname);
    if (safePath === "/") return "home";
    if (safePath === "/about") return "about";
    if (safePath === "/member") return "member";
    if (safePath === "/stage") return "stage";
    if (safePath === "/scenario") return "scenario";
    if (safePath === "/contact") return "contact";
    if (safePath === MEMBER_FEE_REGISTER_PATH) return "member_fee_registration";
    if (safePath === "/member-fee/complete") return "member_fee_complete";
    if (safePath.startsWith("/post/")) return "post_detail";
    if (safePath.startsWith("/performance/")) return "performance_detail";
    if (safePath.startsWith("/news/")) return "news_detail";
    return "not_found";
}

export function trackPageView({ pathname, title }) {
    if (typeof window === "undefined") return;
    const safePath = normalizeAnalyticsPath(pathname);
    if (!safePath || lastTrackedPagePath === safePath) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: "page_view_custom",
        page_path: safePath,
        page_title: title || document.title || "",
        page_type: resolvePageType(safePath),
    });

    lastTrackedPagePath = safePath;
}

export function trackDataLayerEvent(event, parameters = {}) {
    if (typeof window === "undefined" || !event) return;

    const requestedPath = typeof parameters.page_path === "string"
        ? parameters.page_path
        : window.location.pathname || "/";
    const safePath = normalizeAnalyticsPath(requestedPath);
    const payload = Object.fromEntries(
        Object.entries({
            ...parameters,
            page_path: safePath,
            page_type: parameters.page_type || resolvePageType(safePath),
        }).filter(([, value]) => value !== undefined && value !== null),
    );

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        ...payload,
        event,
    });
}
