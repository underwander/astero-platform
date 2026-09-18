import assert from "node:assert/strict";
import test from "node:test";
import { canAccessCrmClient, hasCrmPermission } from "../src/lib/crm-permissions.ts";

const admin = { sub: "admin-1", role: "ADMIN" };
const manager = { sub: "manager-1", role: "MANAGER" };

test("only admins can reset a CRM login password", () => {
  assert.equal(hasCrmPermission(admin, "RESET_CLIENT_PASSWORD"), true);
  assert.equal(hasCrmPermission(manager, "RESET_CLIENT_PASSWORD"), false);
  assert.equal(hasCrmPermission({ role: "CLIENT" }, "RESET_CLIENT_PASSWORD"), false);
});

test("managers can edit only their assigned clients", () => {
  assert.equal(canAccessCrmClient(manager, { role: "CLIENT", managerId: "manager-1" }), true);
  assert.equal(canAccessCrmClient(manager, { role: "CLIENT", managerId: "manager-2" }), false);
  assert.equal(canAccessCrmClient(admin, { role: "CLIENT", managerId: null }), true);
  assert.equal(canAccessCrmClient(admin, { role: "MANAGER", managerId: null }), false);
});
