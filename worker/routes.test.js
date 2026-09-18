import assert from "node:assert/strict";
import test from "node:test";

import { isGetLikeMethod, resolveWorkerRoute } from "./routes.js";

test("maps current Pages API routes to Worker handlers", () => {
  assert.deepEqual(resolveWorkerRoute("/api/draft"), {
    kind: "function",
    id: "draft",
    params: {},
  });
  assert.deepEqual(resolveWorkerRoute("/api/web-members"), {
    kind: "function",
    id: "web-members",
    params: {},
  });
  assert.deepEqual(resolveWorkerRoute("/api/web-sitenews"), {
    kind: "function",
    id: "web-sitenews",
    params: {},
  });
});

test("maps the optional catch-all image route and decodes segments", () => {
  assert.deepEqual(resolveWorkerRoute("/img/member/foo%20bar.jpg"), {
    kind: "function",
    id: "image-proxy",
    params: { path: ["member", "foo bar.jpg"] },
  });
  assert.deepEqual(resolveWorkerRoute("/img"), {
    kind: "function",
    id: "image-proxy",
    params: { path: [] },
  });
});

test("keeps unknown API paths out of the SPA fallback", () => {
  assert.deepEqual(resolveWorkerRoute("/api/not-defined"), {
    kind: "api-not-found",
  });
});

test("sends non-dynamic routes to static assets", () => {
  assert.deepEqual(resolveWorkerRoute("/"), { kind: "asset" });
  assert.deepEqual(resolveWorkerRoute("/about"), { kind: "asset" });
  assert.deepEqual(resolveWorkerRoute("/assets/app.js"), { kind: "asset" });
});

test("GET and HEAD are accepted by the migrated read-only routes", () => {
  assert.equal(isGetLikeMethod("GET"), true);
  assert.equal(isGetLikeMethod("HEAD"), true);
  assert.equal(isGetLikeMethod("POST"), false);
});
