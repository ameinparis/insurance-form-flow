const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { investmentPermissionsFor, createInvestmentGuards } = require("./investmentAccess.cjs");
const { canManageFunding } = require("./fundingAccess.cjs");

const all = { canViewInvestments: true, canSubmitInvestmentRequests: true, canAuthoriseInvestmentTransactions: true, canExecuteInvestmentTransactions: true };
const none = { canViewInvestments: false, canSubmitInvestmentRequests: false, canAuthoriseInvestmentTransactions: false, canExecuteInvestmentTransactions: false };
test("Super Admin has global investment oversight without organisation or policy scope", () => {
  assert.deepEqual(investmentPermissionsFor("superuser", false, false), all);
});
test("Root Admin can submit, authorise and execute within authorised client policies", () => {
  assert.deepEqual(investmentPermissionsFor("admin", true, true), all);
  assert.deepEqual(investmentPermissionsFor("admin", true, false), none);
});
for (const root of [true, false]) {
  test(`Advisor in ${root ? "root" : "external"} organisation can only view/submit for authorised policies`, () => {
    assert.deepEqual(investmentPermissionsFor("user", root, true), { ...none, canViewInvestments: true, canSubmitInvestmentRequests: true });
    assert.deepEqual(investmentPermissionsFor("user", root, false), none);
  });
}
test("External Admin can view an already-authorised policy but cannot request, authorise or execute", () => {
  assert.deepEqual(investmentPermissionsFor("admin", false, true), { ...none, canViewInvestments: true });
  assert.deepEqual(investmentPermissionsFor("admin", false, false), none);
});
test("Funding permission remains independent and restricted to Super Admin / Root Admin", () => {
  for (const [role, root, allowed] of [["superuser", false, true], ["admin", true, true], ["admin", false, false], ["user", true, false], ["user", false, false]]) {
    assert.equal(canManageFunding(role, root), allowed);
  }
});
test("Unknown roles fail closed despite claimed policy access", () => {
  for (const role of [null, "", "unknown", "super_admin"]) assert.deepEqual(investmentPermissionsFor(role, true, true), none);
});

const users = {
  super: { role: "superuser" }, rootAdmin: { role: "admin", organisationId: "root" },
  externalAdmin: { role: "admin", organisationId: "external" },
  advisor: { role: "user", organisationId: "root" }, externalAdvisor: { role: "user", organisationId: "external" },
  orphan: { role: "admin" }, unknown: { role: "unknown", organisationId: "root" },
};
const organisations = { root: { isRootOrganisation: true }, external: { isRootOrganisation: false } };
const q = (value) => ({ select() { return this; }, lean: async () => value });
const User = { findById: (id) => q(users[id]) };
const Organisation = { findById: (id) => q(organisations[id]) };
// Exercise the actual existing boundary, not a permissive mock or a second implementation.
const server = readFileSync(join(__dirname, "server.js"), "utf8");
const start = server.indexOf("const requireRootOrgAccess = async");
const end = server.indexOf("/* ---------------------------- Audit Log Helper", start);
assert.ok(start >= 0 && end > start);
const requireRootOrgAccess = new Function("User", "Organisation", `${server.slice(start, end)}; return requireRootOrgAccess;`)(User, Organisation);
let lookups = 0;
const guards = createInvestmentGuards({ User, Organisation, requireRootOrgAccess, getPolicy: () => ({
  findOne(filter) {
    lookups++;
    assert.deepEqual(filter.status, { $in: ["APPROVED", "ACTIVE"] });
    return q(filter.id === "POL-approved" ? { id: filter.id, clientId: "client-1", status: "APPROVED" } : null);
  },
}) });
async function call(guard, userId, policyId = "POL-approved", extra = {}) {
  const res = { code: 200, status(code) { this.code = code; return this; }, json() { return this; } };
  const access = await guards[guard]({ user: { userId, ...extra }, params: { policyId } }, res);
  return { code: res.code, access };
}
test("Backend permits Super Admin and Root Admin without requiring a Super Admin participant", async () => {
  for (const id of ["super", "rootAdmin"]) {
    for (const guard of Object.keys(guards)) assert.ok((await call(guard, id)).access);
  }
});
test("Backend Advisor may view/submit but cannot authorise even their own request or execute", async () => {
  assert.ok((await call("requireInvestmentPolicyAccess", "advisor")).access);
  assert.ok((await call("requireInvestmentRequester", "advisor")).access);
  assert.equal((await call("requireInvestmentAuthoriser", "advisor")).code, 403);
  assert.equal((await call("requireInvestmentExecutor", "advisor")).code, 403);
});
test("Backend preserves external organisation denial before any policy lookup", async () => {
  const before = lookups;
  for (const id of ["externalAdmin", "externalAdvisor", "orphan"]) {
    for (const guard of Object.keys(guards)) assert.equal((await call(guard, id)).code, 403);
  }
  assert.equal(lookups, before);
});
test("Backend ignores forged role/organisation claims and denies unknown users", async () => {
  assert.equal((await call("requireInvestmentAuthoriser", "advisor", "POL-approved", { role: "superuser", organisationId: "root" })).code, 403);
  assert.equal((await call("requireInvestmentRequester", "unknown")).code, 403);
  assert.equal((await call("requireInvestmentRequester", "missing")).code, 401);
  assert.equal((await call("requireInvestmentRequester", undefined)).code, 401);
});
test("Backend requires a saved approved/active client policy, not an arbitrary or draft ID", async () => {
  assert.equal((await call("requireInvestmentRequester", "advisor", "")).code, 400);
  assert.equal((await call("requireInvestmentRequester", "advisor", "POL-draft")).code, 404);
  assert.equal((await call("requireInvestmentRequester", "advisor", "missing")).code, 404);
});
test("Existing Root Organisation access remains unchanged for every role and organisation", async () => {
  for (const [id, permitted] of [["super", true], ["rootAdmin", true], ["advisor", true], ["externalAdmin", false], ["externalAdvisor", false], ["orphan", false], ["missing", false]]) {
    const res = { status() { return this; }, json() {} };
    assert.equal(Boolean(await requireRootOrgAccess({ user: { userId: id } }, res)), permitted);
  }
});