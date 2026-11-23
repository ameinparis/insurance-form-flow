const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { createUnitPurchaseHandlers } = require("./unitPurchase.cjs");

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

function setup() {
  const policies = {
    P1: makePolicy("P1", "ACTIVE", "1000.00", [{ id: "fA", name: "Fund A", mgr: "M1", pct: "25", amt: "250.00" }, { id: "fB", name: "Fund B", mgr: "M2", pct: "75", amt: "750.00" }]),
    PN: makePolicy("PN", "APPROVED", "500.00", [{ id: "fA", name: "Fund A", mgr: "M1", pct: "100", amt: "500.00" }]),
  };
  const funding = { P1: { status: "confirmed" } };
  const valuations = [
    { _id: "v1", fundId: "fA", valuationDate: "2026-02-01", unitPrice: "1.7", revision: 1 },
    { _id: "v2", fundId: "fB", valuationDate: "2026-02-01", unitPrice: "3.0798", revision: 3 },
  ];
  const before = JSON.stringify({ policies, funding, valuations });
  const purchases = []; const audits = [];
  const PolicyUnitPurchase = {
    create: async (doc) => { await new Promise((r) => setImmediate(r));
      if (purchases.some((p) => p.policyId === doc.policyId && p.fundId === doc.fundId && p.type === doc.type)) throw Object.assign(new Error("dup"), { code: 11000 });
      purchases.push(doc); return doc; },
    find: ({ policyId }) => q(purchases.filter((p) => p.policyId === policyId)),
  };
  const h = createUnitPurchaseHandlers({ PolicyUnitPurchase, User, Organisation, requireRootOrgAccess,
    getPolicy: () => ({ findOne: (f) => q(f.status.$in.includes(policies[f.id]?.status) ? policies[f.id] : null) }),
    PolicyFunding: { findOne: ({ policyId }) => q(funding[policyId] || null) },
    AssetManagerFund: { find: () => q([{ _id: "fA", assetManagerId: "m1" }, { _id: "fB", assetManagerId: "m2" }]) },
    Valuation: { findOne: (f) => q(valuations.find((v) => v.fundId === f.fundId && v.valuationDate === f.valuationDate) || null) },
    logAudit: async (a) => audits.push(a),
  });
  const res = () => ({ code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } });
  const confirm = async (userId, policyId, fundId, body) => { const r = res(); await h.confirmInitialPurchase({ user: { userId }, params: { policyId, fundId }, body, headers: {} }, r); return r; };
  const list = async (userId, policyId) => { const r = res(); await h.listPurchases({ user: { userId }, params: { policyId }, headers: {} }, r); return r; };
  return { confirm, list, purchases, audits, valuations, unchanged: () => JSON.stringify({ policies, funding, valuations }) === before };
}
const { computeInitialPurchase } = require("./purchasePreview.cjs");
const goodBody = (over = {}) => ({ confirmed: true, purchaseDate: "2026-02-01", approvedAmount: "750.00", unitPrice: "3.079800", valuationId: "v2", valuationRevision: 3, inputHash: HASH, ...over });
let HASH = "";
test.before(async () => {
  const s = setup(); const r = await s.confirm("rootAdmin", "P1", "fB", { confirmed: true, purchaseDate: "2026-02-01", approvedAmount: "x" });
  assert.equal(r.body.code, "PREVIEW_STALE");
  // derive the server's snapshot hash from the shared computation (no hardcoding)
  const pol = makePolicy("P1", "ACTIVE", "1000.00", [{ id: "fA", name: "Fund A", mgr: "M1", pct: "25", amt: "250.00" }, { id: "fB", name: "Fund B", mgr: "M2", pct: "75", amt: "750.00" }]);
  const c = await computeInitialPurchase({ policy: pol, fundId: "fB", date: "2026-02-01",
    PolicyFunding: { findOne: () => q({ status: "confirmed" }) }, AssetManagerFund: { find: () => q([{ _id: "fA", assetManagerId: "m1" }, { _id: "fB", assetManagerId: "m2" }]) },
    Valuation: { findOne: () => q({ _id: "v2", valuationDate: "2026-02-01", unitPrice: "3.0798", revision: 3 }) } });
  HASH = c.result.inputHash;
});

for (const id of ["super", "rootAdmin"]) test(`${id} records an immutable initial purchase with full-precision units`, async () => {
  const s = setup();
  const r = await s.confirm(id, "P1", "fB", goodBody());
  assert.equal(r.code, 201);
  const p = s.purchases[0];
  assert.equal(p.units, "243.5223066432885252289109682446912", "units = 750 / 3.0798 at Decimal128 precision");
  assert.equal(p.closingBalance, "750.00");
  assert.equal(p.unitPrice, "3.079800"); assert.equal(p.valuationRevision, 3); assert.equal(p.type, "INITIAL");
  assert.equal(s.audits[0].action, "INITIAL_UNITS_PURCHASED");
  assert.ok(s.unchanged(), "policy, funding and valuations untouched");
});
for (const id of ["externalAdmin", "advisor"]) test(`${id} cannot confirm a purchase`, async () => {
  const s = setup(); const r = await s.confirm(id, "P1", "fB", goodBody());
  assert.equal(r.code, 403); assert.equal(s.purchases.length, 0);
});
test("requires the explicit confirmation tick", async () => {
  const s = setup(); assert.equal((await s.confirm("rootAdmin", "P1", "fB", goodBody({ confirmed: false }))).code, 400);
});
test("unconfirmed funding is refused", async () => {
  const s = setup(); assert.equal((await s.confirm("rootAdmin", "PN", "fA", goodBody())).body.code, "FUNDING_NOT_CONFIRMED");
});
test("fund outside policy and missing price are refused", async () => {
  const s = setup();
  assert.equal((await s.confirm("rootAdmin", "P1", "fZ", goodBody())).body.code, "FUND_NOT_IN_POLICY");
  assert.equal((await s.confirm("rootAdmin", "P1", "fB", goodBody({ purchaseDate: "2026-02-02" }))).body.code, "PRICE_NOT_FOUND");
});
test("changed amount, price or valuation revision is rejected as stale", async () => {
  const s = setup();
  for (const over of [{ approvedAmount: "751.00" }, { unitPrice: "3.080000" }, { valuationRevision: 2 }, { inputHash: "other" }])
    assert.equal((await s.confirm("rootAdmin", "P1", "fB", goodBody(over))).body.code, "PREVIEW_STALE");
  s.valuations[1].revision = 4; s.valuations[1].unitPrice = "3.1";
  assert.equal((await s.confirm("rootAdmin", "P1", "fB", goodBody())).body.code, "PREVIEW_STALE");
  assert.equal(s.purchases.length, 0);
});
test("duplicate and concurrent confirmations record only one purchase", async () => {
  const s = setup();
  const [a, b] = await Promise.all([s.confirm("rootAdmin", "P1", "fB", goodBody()), s.confirm("super", "P1", "fB", goodBody())]);
  assert.deepEqual([a.code, b.code].sort(), [201, 409]);
  assert.equal((await s.confirm("rootAdmin", "P1", "fB", goodBody())).body.code, "ALREADY_PURCHASED");
  assert.equal(s.purchases.length, 1);
});
test("each fund is purchased independently; advisors can read purchases", async () => {
  const s = setup();
  await s.confirm("rootAdmin", "P1", "fB", goodBody());
  const list = await s.list("advisor", "P1");
  assert.equal(list.code, 200); assert.equal(list.body.length, 1); assert.equal(list.body[0].fundId, "fB");
  assert.equal(list.body[0].status, "PURCHASED");
});
