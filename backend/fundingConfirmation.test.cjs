const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { createFundingConfirmationHandlers } = require("./fundingConfirmation.cjs");

const users = {
  super: { role: "superuser", firstName: "Sam", lastName: "Super" },
  rootAdmin: { role: "admin", organisationId: "root", firstName: "Rita", lastName: "Root" },
  externalAdmin: { role: "admin", organisationId: "external" },
  advisor: { role: "user", organisationId: "root" }, externalAdvisor: { role: "user", organisationId: "external" },
};
const organisations = { root: { isRootOrganisation: true }, external: { isRootOrganisation: false } };
const q = (value) => ({ select() { return this; }, lean: async () => value });
const User = { findById: (id) => q(users[id]) };
const Organisation = { findById: (id) => q(organisations[id]) };
const server = readFileSync(join(__dirname, "server.js"), "utf8");
const start = server.indexOf("const requireRootOrgAccess = async");
const end = server.indexOf("/* ---------------------------- Audit Log Helper", start);
const requireRootOrgAccess = new Function("User", "Organisation", `${server.slice(start, end)}; return requireRootOrgAccess;`)(User, Organisation);

function setup() {
  const policies = {
    "POL-approved": { id: "POL-approved", clientId: "c1", status: "APPROVED", form: { investmentAmount: "2000000", netInvestment: "1947500.00", portfolioAllocations: '{"Money Market Fund":"30"}' } },
    "POL-draft": { id: "POL-draft", clientId: "c1", status: "DRAFT", form: {} },
  };
  const snapshot = JSON.stringify(policies);
  const records = new Map(); const audits = [];
  const PolicyFunding = {
    findOne: ({ policyId }) => q(records.get(policyId) || null),
    create: async (doc) => {
      if (records.has(doc.policyId)) { const e = new Error("dup"); e.code = 11000; throw e; }
      records.set(doc.policyId, doc); return doc;
    },
  };
  const getPolicy = () => ({ findOne: (f) => q(f.status.$in.includes(policies[f.id]?.status) ? policies[f.id] : null) });
  const h = createFundingConfirmationHandlers({ PolicyFunding, User, Organisation, requireRootOrgAccess, getPolicy, logAudit: async (a) => audits.push(a) });
  const call = async (fn, userId, body = { confirmed: true }, policyId = "POL-approved") => {
    const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await h[fn]({ user: { userId }, params: { policyId }, body, headers: {} }, res);
    return res;
  };
  return { call, records, audits, policies, snapshot };
}

for (const id of ["super", "rootAdmin"]) test(`${id} can confirm funds once, with identity and timestamp`, async () => {
  const s = setup();
  const r = await s.call("confirmFunding", id);
  assert.equal(r.code, 201);
  const rec = s.records.get("POL-approved");
  assert.equal(rec.status, "confirmed"); assert.equal(rec.confirmedBy, id); assert.ok(rec.confirmedAt instanceof Date);
  assert.equal(rec.revision, 1); assert.equal(rec.history.length, 1); assert.equal(rec.history[0].action, "CONFIRMED");
});
for (const id of ["advisor", "externalAdvisor", "externalAdmin"]) test(`${id} cannot confirm funds`, async () => {
  const s = setup();
  assert.equal((await s.call("confirmFunding", id)).code, 403);
  assert.equal(s.records.size, 0); assert.equal(s.audits.length, 0);
});
test("Advisor can view status but is not offered confirmation; external users cannot view", async () => {
  const s = setup();
  const r = await s.call("getFunding", "advisor");
  assert.equal(r.code, 200); assert.equal(r.body.status, "awaiting"); assert.equal(r.body.canConfirm, false);
  assert.equal((await s.call("getFunding", "rootAdmin")).body.canConfirm, true);
  for (const id of ["externalAdmin", "externalAdvisor"]) assert.equal((await s.call("getFunding", id)).code, 403);
});
test("Unapproved policies and missing checkbox are rejected", async () => {
  const s = setup();
  assert.equal((await s.call("confirmFunding", "rootAdmin", { confirmed: true }, "POL-draft")).code, 404);
  assert.equal((await s.call("confirmFunding", "rootAdmin", {})).code, 400);
  assert.equal((await s.call("confirmFunding", "rootAdmin", { confirmed: "true" })).code, 400);
  assert.equal(s.records.size, 0);
});
test("Duplicate confirmation returns 409 and leaves the original record and single audit entry", async () => {
  const s = setup();
  await s.call("confirmFunding", "rootAdmin");
  const r = await s.call("confirmFunding", "super");
  assert.equal(r.code, 409);
  assert.equal(s.records.get("POL-approved").confirmedBy, "rootAdmin");
  assert.equal(s.audits.length, 1);
  const status = await s.call("getFunding", "advisor");
  assert.equal(status.body.status, "confirmed"); assert.equal(status.body.confirmedByName, "Rita Root"); assert.equal(status.body.canConfirm, false);
});
test("Confirmation is written to the audit log", async () => {
  const s = setup();
  await s.call("confirmFunding", "rootAdmin");
  assert.equal(s.audits[0].action, "FUNDS_CONFIRMED"); assert.equal(s.audits[0].userId, "rootAdmin");
  assert.equal(s.audits[0].metadata.policyId, "POL-approved");
  assert.match(server, /"FUNDS_CONFIRMED"/, "audit enum must accept the action");
});
test("Confirmation never changes the policy, allocations or net investment, nor activates/purchases", async () => {
  const s = setup();
  await s.call("confirmFunding", "super");
  assert.equal(JSON.stringify(s.policies), s.snapshot);
  const rec = s.records.get("POL-approved");
  for (const k of ["units", "unitsPurchased", "activated", "activatedAt", "investmentStatus", "valuationId"]) assert.equal(rec[k], undefined);
  const src = readFileSync(join(__dirname, "fundingConfirmation.cjs"), "utf8");
  assert.doesNotMatch(src, /updateOne|updateMany|findOneAndUpdate|save\(|Valuation|activate\(/);
});
test("No reversal endpoint exists in Stage 3", () => {
  const src = readFileSync(join(__dirname, "fundingConfirmation.cjs"), "utf8");
  assert.doesNotMatch(src, /app\.(patch|delete|put)\(/);
  assert.doesNotMatch(src, /\/reverse/);
});
