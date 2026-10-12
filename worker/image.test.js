import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet } from "../functions/img/[[path]].js";

test("image proxy passes the runtime IMG_KEY only to its upstream request", async (t) => {
  let upstream;
  const logMock = t.mock.method(console, "log", () => {});
  t.mock.method(globalThis, "fetch", async (input) => {
    upstream = new URL(input);
    return new Response("image", { headers: { "Content-Type": "image/jpeg" } });
  });
  const response = await onRequestGet({
    env: { IMG_ORIGIN: "https://images.example.test", IMG_KEY: "synthetic-image-key" },
    params: { path: ["member", "photo.jpg"] },
  });
  assert.equal(response.status, 200);
  assert.equal(upstream.origin, "https://images.example.test");
  assert.equal(upstream.searchParams.get("k"), "synthetic-image-key");
  assert.equal(await response.text(), "image");
  assert.equal(JSON.stringify(logMock.mock.calls.map((call) => call.arguments)).includes("synthetic-image-key"), false);
});

test("image proxy rejects absent IMG_KEY before fetching upstream", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Upstream must not be called without IMG_KEY");
  });
  const response = await onRequestGet({
    env: { IMG_ORIGIN: "https://images.example.test" },
    params: { path: ["member", "photo.jpg"] },
  });
  assert.equal(response.status, 503);
  assert.equal(fetchMock.mock.callCount(), 0);
});
