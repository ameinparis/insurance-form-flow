const { test } = require("node:test");
const assert = require("node:assert/strict");
const { canManageFunding, createFundingGuard } = require("./fundingAccess.cjs");

const users = {
  super: { role: "superuser", organisationId: "ext" },
  superNoOrg: { role: "superuser" },
  rootAdmin: { role: "admin", organisationId: "root" },
  extAdmin: { role: "admin", organisationId: "ext" },
  rootAdvisor: { role: "user", organisationId: "root" },
  extAdvisor: { role: "user", organisationId: "ext" },
  orphanAdmin: { role: "admin" },
};
const orgs = { root: { isRootOrganisation: true }, ext: { isRootOrganisation: false } };
const q = (v) => ({ select() { return this; }, lean: async () => v });
const guard = createFundingGuard({ User: { findById: (id) => q(users[id]) }, Organisation: { findById: (id) => q(orgs[id]) } }).requireFundingManager;
async function call(userId) {
  const res = { code: 200, status(c) { this.code = c; return this; }, json() { return this; } };
  const actor = await guard({ user: { userId } }, res);
  return { actor, code: res.code };
}

test("Super Admin may manage funding from any organisation", async () => {
  assert.ok((await call("super")).actor);
  assert.ok((await call("superNoOrg")).actor);
});
test("Root Organisation Admin may manage funding", async () => {
  const r = await call("rootAdmin"); assert.ok(r.actor); assert.equal(r.actor.id, "rootAdmin");
});
test("External Organisation Admin is denied", async () => {
  assert.deepEqual(await call("extAdmin"), { actor: null, code: 403 });
});
test("Advisors are denied in root and external organisations", async () => {
  assert.equal((await call("rootAdvisor")).code, 403);
  assert.equal((await call("extAdvisor")).code, 403);
});
test("Admin without an organisation and unknown users are denied", async () => {
  assert.equal((await call("orphanAdmin")).code, 403);
  assert.equal((await call("missing")).code, 401);
});
test("Pure rule matches stored role values only", () => {
  assert.equal(canManageFunding("admin", true), true);
  assert.equal(canManageFunding("admin", false), false);
  assert.equal(canManageFunding("user", true), false);
  assert.equal(canManageFunding("super_admin", false), false); // not a stored value
});
