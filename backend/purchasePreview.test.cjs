const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { createPurchasePreviewHandler } = require("./purchasePreview.cjs");

const users = {
  super: { role: "superuser" }, rootAdmin: { role: "admin", organisationId: "root" },
  externalAdmin: { role: "admin", organisationId: "external" },
  advisor: { role: "user", organisationId: "root" },
};
const organisations = { root: { isRootOrganisation: true }, external: { isRootOrganisation: false } };
const q = (value) => ({ select() { return this; }, lean: async () => value });
const User = { findById: (id) => q(users[id]) };
const Organisation = { findById: (id) => q(organisations[id]) };
const server = readFileSync(join(__dirname, "server.js"), "utf8");
const start = server.indexOf("const requireRootOrgAccess = async");
const end = server.indexOf("/* ---------------------------- Audit Log Helper", start);
const requireRootOrgAccess = new Function("User", "Organisation", `${server.slice(start, end)}; return requireRootOrgAccess;`)(User, Organisation);

// Generated fixture (not business data): arbitrary net/allocations per test.
function makePolicy(id, status, net, funds) {
  const fmt = (v) => "BWP " + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const section = { title: "Investment Portfolio Setup", fields: [{ label: "Net Investment Amount", value: fmt(net) }, { label: "Total Allocation", value: "100%" }],
    rows: funds.map((f) => ({ name: f.name, detail: f.mgr, value: `${f.pct}% — ${fmt(f.amt)}` })) };
  const snap = JSON.stringify({ version: 1, sections: [section] });
  return { id, clientId: "cX", status, form: { netInvestment: net, selectedFunds: JSON.stringify(funds.map((f) => ({ id: f.id, name: f.name, assetManagerName: f.mgr }))),
    portfolioAllocations: JSON.stringify(Object.fromEntries(funds.map((f) => [f.id, f.pct]))), reviewSnapshot: snap, portfolioReviewSnapshot: snap } };
}

function setup({ funded = true } = {}) {
  const policies = {
    P1: makePolicy("P1", "APPROVED", "1000.00", [{ id: "fA", name: "Fund A", mgr: "M1", pct: "25", amt: "250.00" }, { id: "fB", name: "Fund B", mgr: "M2", pct: "75", amt: "750.00" }]),
    P2: makePolicy("P2", "APPROVED", "5000.00", [{ id: "fB", name: "Fund B", mgr: "M2", pct: "100", amt: "5000.00" }]),
    PA: makePolicy("PA", "ACTIVE", "1000.00", [{ id: "fA", name: "Fund A", mgr: "M1", pct: "100", amt: "1000.00" }]),
    PD: makePolicy("PD", "DRAFT", "1000.00", [{ id: "fA", name: "Fund A", mgr: "M1", pct: "100", amt: "1000.00" }]),
  };
  const funding = funded ? { P1: { status: "confirmed" }, P2: { status: "confirmed" }, PA: { status: "confirmed" } } : {};
  const valuations = [
    { _id: "v1", fundId: "fA", valuationDate: "2026-01-05", unitPrice: "2.5", revision: 1 },
    { _id: "v2", fundId: "fB", valuationDate: "2026-01-05", unitPrice: "3.0798", revision: 2 },
    { _id: "v3", fundId: "fB", valuationDate: "2026-01-06", unitPrice: "4", revision: 1 },
  ];
  const before = JSON.stringify({ policies, funding, valuations });
  const h = createPurchasePreviewHandler({ User, Organisation, requireRootOrgAccess,
    getPolicy: () => ({ findOne: (f) => q(f.status.$in.includes(policies[f.id]?.status) ? policies[f.id] : null) }),
    PolicyFunding: { findOne: ({ policyId }) => q(funding[policyId] || null) },
    AssetManagerFund: { find: () => q([{ _id: "fA", assetManagerId: "m1" }, { _id: "fB", assetManagerId: "m2" }]) },
    Valuation: { findOne: (f) => q(valuations.find((v) => v.fundId === f.fundId && v.valuationDate === f.valuationDate) || null) },
  });
  const call = async (userId, policyId, fundId, date) => {
    const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await h({ user: { userId }, params: { policyId, fundId }, query: { date }, headers: {} }, res);
    return res;
  };
  return { call, unchanged: () => JSON.stringify({ policies, funding, valuations }) === before };
}

for (const id of ["super", "rootAdmin"]) test(`${id} gets a dynamic preview from saved amount and exact-date price`, async () => {
  const s = setup();
  const r = await s.call(id, "P1", "fB", "2026-01-05");
  assert.equal(r.code, 200);
  assert.equal(r.body.status, "PREVIEW_NOT_ACTIVATED");
  assert.equal(r.body.approvedAmount, "750.00"); assert.equal(r.body.unitPrice, "3.079800");
  assert.equal(r.body.displayedUnits, "243.52"); assert.ok(r.body.estimatedUnits.startsWith("243.5223066432"));
  assert.equal(r.body.valuationId, "v2"); assert.equal(r.body.valuationRevision, 2);
  assert.ok(s.unchanged());
});
test("different policy, fund, allocation and date give different results", async () => {
  const s = setup();
  assert.equal((await s.call("rootAdmin", "P2", "fB", "2026-01-06")).body.displayedUnits, "1250.00");
  assert.equal((await s.call("rootAdmin", "P1", "fA", "2026-01-05")).body.displayedUnits, "100.00");
});
for (const id of ["advisor", "externalAdmin"]) test(`${id} is refused`, async () => {
  assert.equal((await setup().call(id, "P1", "fB", "2026-01-05")).code, 403);
});
test("no price for that exact date → 404, never another date", async () => {
  const r = await setup().call("rootAdmin", "P1", "fA", "2026-01-06");
  assert.equal(r.code, 404); assert.equal(r.body.code, "PRICE_NOT_FOUND");
});
test("unconfirmed funding → 409", async () => {
  const r = await setup({ funded: false }).call("rootAdmin", "P1", "fB", "2026-01-05");
  assert.equal(r.code, 409); assert.equal(r.body.code, "FUNDING_NOT_CONFIRMED");
});
test("draft and active (non-approved) policies are refused", async () => {
  const s = setup();
  assert.equal((await s.call("rootAdmin", "PD", "fA", "2026-01-05")).code, 404);
  assert.equal((await s.call("rootAdmin", "PA", "fA", "2026-01-05")).body.code, "NOT_APPROVED");
});
test("fund not in policy → 404; bad date → 400", async () => {
  const s = setup();
  assert.equal((await s.call("rootAdmin", "P2", "fA", "2026-01-05")).body.code, "FUND_NOT_IN_POLICY");
  assert.equal((await s.call("rootAdmin", "P1", "fB", "05.01.2026")).code, 400);
});
