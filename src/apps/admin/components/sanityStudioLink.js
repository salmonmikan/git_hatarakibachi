const STAGING_HOSTS = new Set(["localhost", "127.0.0.1", "staging.hatarakibachi.com"]);

export function getAdminSanityDataset(hostname = window.location.hostname) {
    return STAGING_HOSTS.has(hostname) ? "staging" : "production";
}

export function buildSanityStudioEditUrl(documentId, schemaType, dataset = getAdminSanityDataset()) {
    if (!documentId || !schemaType) return "#";
    return `https://hatarakibachi.sanity.studio/${dataset}/intent/edit/id=${encodeURIComponent(documentId)};type=${encodeURIComponent(schemaType)}`;
}
