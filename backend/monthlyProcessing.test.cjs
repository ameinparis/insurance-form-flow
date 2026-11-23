const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { createMonthlyProcessingHandlers, monthlyCalculation } = require("./monthlyProcessing.cjs");

const users = { super: { role: "superuser" }, rootAdmin: { role: "admin", organisationId: "root" },
  externalAdmin: { role: "admin", organisationId: "external" }, advisor: { role: "user", organisationId: "root" } };
const organisations = { root: { isRootOrganisation: true }, external: { isRootOrganisation: false } };
const q = (value) => ({ select() { return this; }, lean: async () => value });
const User = { findById: (id) => q(users[id]) };
const Organisation = { findById: (id) => q(organisations[id]) };
const server = readFileSync(join(__dirname, "server.js"), "utf8");
const start = server.indexOf("const requireRootOrgAccess = async");
const end = server.indexOf("/* ---------------------------- Audit Log Helper", start);
const requireRootOrgAccess = new Function("User", "Organisation", `${server.slice(start, end)}; return requireRootOrgAccess;`)(User, Organisation);

// Generated fixture values (not business data).
function setup({ premium = "20.00", fee = "0.0833", alloc = "70", legacy = [] } = {}) {
  const policies = { P1: { id: "P1", clientId: "cX", status: "ACTIVE", form: { funeralPremium: premium, portfolioAllocations: JSON.stringify({ fA: alloc }) } } };
  const purchases = [{ _id: "pu1", policyId: "P1", fundId: "fA", type: "INITIAL", purchaseDate: "2026-01-10", unitPrice: "2.5", units: "400.123456789", closingBalance: "1000.31" }];
  const valuations = [
    { _id: "v1", fundId: "fA", valuationDate: "2026-01-31", unitPrice: "2.612345", revision: 1 },
    { _id: "v2", fundId: "fA", valuationDate: "2026-02-28", unitPrice: "2.400001", revision: 2 },
  ];
  const feeConfig = { administrationFeePct: fee, key: "global" };
  const batches = []; const audits = [];
  const before = JSON.stringify({ purchases, valuations, policies });
  const PolicyMonthlyBatch = {
    create: async (doc) => { await new Promise((r) => setImmediate(r));
      if (batches.some((a) => a.policyId === doc.policyId && a.fundId === doc.fundId && (a.valuationDate === doc.valuationDate || a.sequence === doc.sequence))) throw Object.assign(new Error("dup"), { code: 11000 });
      batches.push(doc); return doc; },
    find: (f) => q(batches.filter((a) => a.policyId === f.policyId && (!f.fundId || a.fundId === f.fundId))),
  };
  const h = createMonthlyProcessingHandlers({ PolicyMonthlyBatch, User, Organisation, requireRootOrgAccess,
    PolicyMarketAdjustment: { find: () => q(legacy) },
    FeeConfig: { findOne: () => q(feeConfig) },
    PolicyUnitPurchase: { findOne: (f) => q(purchases.find((p) => p.policyId === f.policyId && p.fundId === f.fundId) || null) },
    getPolicy: () => ({ findOne: (f) => q(f.status.$in.includes(policies[f.id]?.status) ? policies[f.id] : null) }),
    PolicyFunding: { findOne: () => q({ status: "confirmed" }) },
    Valuation: { findOne: (f) => q(valuations.find((v) => v.fundId === f.fundId && v.valuationDate === f.valuationDate) || null) },
    logAudit: async (a) => audits.push(a) });
  const res = () => ({ code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } });
  const preview = async (u, date) => { const r = res(); await h.preview({ user: { userId: u }, params: { policyId: "P1", fundId: "fA" }, query: { date }, headers: {} }, r); return r; };
  const confirm = async (u, body) => { const r = res(); await h.confirm({ user: { userId: u }, params: { policyId: "P1", fundId: "fA" }, body, headers: {} }, r); return r; };
  const confirmFromPreview = async (u, date) => { const p = await preview("rootAdmin", date); return confirm(u, { ...p.body, confirmed: true }); };
  return { preview, confirm, confirmFromPreview, batches, audits, valuations, feeConfig, policies, unchanged: () => JSON.stringify({ purchases, valuations, policies }) === before };
}

test("formula rounds each money step to thebe; fee uses rounded CB1", () => {
  const c = monthlyCalculation({ unitsHeld: "400.123456789", previousUnitPrice: "2.5", newUnitPrice: "2.612345", previousClosingBalance: "1000.31",
    funeralPremium: "20", allocationPercent: "70", adminFeePercent: "0.0833" });
  assert.deepEqual(c, { marketAdjustment: "44.95", closingBalance1: "1045.26", funeralPremium: "-14.00", closingBalance2: "1031.26",
    administrationFee: "-0.87", closingBalance3: "1030.39" });
  // Half-up at the cent boundary: 1000 × 0.0835% = 0.835 → 0.84
  assert.equal(monthlyCalculation({ unitsHeld: "1", previousUnitPrice: "1", newUnitPrice: "1", previousClosingBalance: "1000",
    funeralPremium: "0", allocationPercent: "0", adminFeePercent: "0.0835" }).administrationFee, "-0.84");
});

test("preview returns three ordered rows and writes nothing", async () => {
  const s = setup(); const r = await s.preview("rootAdmin", "2026-01-31");
  assert.equal(r.code, 200);
  assert.deepEqual(r.body.rows.map((x) => [x.description, x.movement, x.closingBalance]), [
    ["Market Price Adjustment", "44.95", "1045.26"], ["Funeral Cover Premium", "-14.00", "1031.26"], ["Administration Fee", "-0.87", "1030.39"]]);
  assert.equal(r.body.unitsHeld, "400.123456789"); assert.equal(r.body.newUnitPrice, "2.612345");
  assert.equal(s.batches.length, 0); assert.equal(s.audits.length, 0); assert.ok(s.unchanged());
});

test("missing premium, fee or allocation block processing", async () => {
  assert.equal((await setup({ premium: "" }).preview("rootAdmin", "2026-01-31")).body.code, "FUNERAL_PREMIUM_MISSING");
  assert.equal((await setup({ fee: "" }).preview("rootAdmin", "2026-01-31")).body.code, "ADMIN_FEE_MISSING");
  assert.equal((await setup({ alloc: "" }).preview("rootAdmin", "2026-01-31")).body.code, "ALLOCATION_MISSING");
});

for (const u of ["super", "rootAdmin"]) test(`${u} confirms one atomic batch; next month chains from CB3`, async () => {
  const s = setup();
  assert.equal((await s.confirmFromPreview(u, "2026-01-31")).code, 201);
  assert.equal(s.batches[0].rows.length, 3); assert.equal(s.audits.length, 1);
  const p2 = await s.preview("rootAdmin", "2026-02-28");
  assert.equal(p2.body.previousClosingBalance, "1030.39"); assert.equal(p2.body.previousUnitPrice, "2.612345");
  assert.equal(p2.body.unitsHeld, "400.123456789"); assert.equal(p2.body.sequence, 2);
  assert.ok(s.unchanged());
});

test("duplicate and out-of-order dates rejected", async () => {
  const s = setup(); await s.confirmFromPreview("rootAdmin", "2026-02-28");
  assert.equal((await s.preview("rootAdmin", "2026-02-28")).body.code, "DUPLICATE_BATCH");
  assert.equal((await s.preview("rootAdmin", "2026-01-31")).body.code, "OUT_OF_ORDER");
});

test("legacy adjustment counts as prior transaction", async () => {
  const s = setup({ legacy: [{ _id: "a1", valuationDate: "2026-01-31", sequence: 1, newUnitPrice: "2.612345", newClosingBalance: "1045.261869" }] });
  assert.equal((await s.preview("rootAdmin", "2026-01-31")).body.code, "OUT_OF_ORDER");
  const r = await s.preview("rootAdmin", "2026-02-28");
  assert.equal(r.body.previousClosingBalance, "1045.26"); assert.equal(r.body.sequence, 2);
});

test("stale preview rejected when fee, premium or price changes", async () => {
  for (const mutate of [(s) => { s.feeConfig.administrationFeePct = "0.09"; }, (s) => { s.policies.P1.form.funeralPremium = "25"; },
    (s) => { s.valuations[0].unitPrice = "2.7"; s.valuations[0].revision = 4; }]) {
    const s = setup(); const p = await s.preview("rootAdmin", "2026-01-31"); mutate(s);
    const r = await s.confirm("rootAdmin", { ...p.body, confirmed: true });
    assert.equal(r.code, 409); assert.equal(r.body.code, "PREVIEW_STALE"); assert.equal(s.batches.length, 0);
  }
});

test("explicit confirmation required; concurrent confirms record one", async () => {
  const s = setup(); const p = await s.preview("rootAdmin", "2026-01-31");
  assert.equal((await s.confirm("rootAdmin", { ...p.body })).body.code, "NOT_CONFIRMED");
  const rs = await Promise.all([1, 2].map(() => s.confirm("rootAdmin", { ...p.body, confirmed: true })));
  assert.deepEqual(rs.map((r) => r.code).sort(), [201, 409]); assert.equal(s.batches.length, 1);
});

for (const u of ["advisor", "externalAdmin"]) test(`${u} cannot preview or confirm`, async () => {
  const s = setup();
  assert.equal((await s.preview(u, "2026-01-31")).code, 403);
  assert.equal((await s.confirm(u, { confirmed: true, valuationDate: "2026-01-31" })).code, 403);
  assert.equal(s.batches.length, 0);
});
