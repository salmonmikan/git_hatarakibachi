# Analytics / registration token hardening plan

Keep the member-fee registration capability token out of HTTP request paths and analytics. Generate registration links with a URL fragment, extract the UUID before GTM initializes, persist it only in same-tab sessionStorage, replace the visible URL with `/member-fee/register`, and use that single sanitized route in React. Rebase the change on the latest Square Phase 1 branch before validation.
