import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionToken,
  expiredSessionCookieHeader,
  sessionCookieHeader,
  verifySessionToken,
} from "../src/lib/session.ts";

test("creates and verifies a signed session", async () => {
  const token = await createSessionToken({ id: "user-1", email: "client@example.com", role: "CLIENT" });
  const session = await verifySessionToken(token);
  assert.equal(session?.sub, "user-1");
  assert.equal(session?.role, "CLIENT");
});

test("rejects a tampered session", async () => {
  const token = await createSessionToken({ id: "user-1", email: "client@example.com", role: "CLIENT" });
  assert.equal(await verifySessionToken(`${token.slice(0, -1)}x`), null);
});

test("session cookie is HttpOnly, root-scoped and same-site", () => {
  const header = sessionCookieHeader("token");
  assert.match(header, /Path=\//);
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Lax/);
  assert.match(header, /Max-Age=28800/);
});

test("logout cookie expires immediately and explicitly", () => {
  const header = expiredSessionCookieHeader();
  assert.match(header, /Max-Age=0/);
  assert.match(header, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
  assert.match(header, /Path=\//);
});

test("two browser sessions for one user remain independently valid", async () => {
  const user = { id: "user-1", email: "client@example.com", role: "CLIENT" };
  const firstBrowserToken = await createSessionToken(user);
  await new Promise((resolve) => setTimeout(resolve, 5));
  const secondBrowserToken = await createSessionToken(user);

  assert.equal((await verifySessionToken(firstBrowserToken))?.sub, user.id);
  assert.equal((await verifySessionToken(secondBrowserToken))?.sub, user.id);
  assert.match(expiredSessionCookieHeader(), /astero_session=;/);
  assert.equal((await verifySessionToken(firstBrowserToken))?.sub, user.id);
});
