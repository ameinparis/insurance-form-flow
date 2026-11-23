const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { createMarketAdjustmentHandlers, marketAdjustment } = require("./marketAdjustment.cjs");

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
function setup({ purchase = true, funded = true } = {}) {
  const policies = { P1: { id: "P1", clientId: "cX", status: "ACTIVE", form: {} } };
  const purchases = purchase ? [{ _id: "pu1", policyId: "P1", fundId: "fA", type: "INITIAL", purchaseDate: "2026-01-10", unitPrice: "2.5", units: "400.123456789", closingBalance: "1000.31" }] : [];
  const valuations = [
    { _id: "v1", fundId: "fA", valuationDate: "2026-01-31", unitPrice: "2.612345", revision: 1 },
    { _id: "v2", fundId: "fA", valuationDate: "2026-02-28", unitPrice: "2.400001", revision: 2 },
    { _id: "v0", fundId: "fA", valuationDate: "2026-01-05", unitPrice: "2.4", revision: 1 },
  ];
  const adjustments = []; const audits = [];
  const before = JSON.stringify({ purchases, valuations, policies });
  const PolicyMarketAdjustment = {
    create: async (doc) => { await new Promise((r) => setImmediate(r));
      if (adjustments.some((a) => a.policyId === doc.policyId && a.fundId === doc.fundId && (a.valuationDate === doc.valuationDate || a.sequence === doc.sequence))) throw Object.assign(new Error("dup"), { code: 11000 });
      adjustments.push(doc); return doc; },
    find: (f) => q(adjustments.filter((a) => a.policyId === f.policyId && (!f.fundId || a.fundId === f.fundId))),
  };
  const h = createMarketAdjustmentHandlers({ PolicyMarketAdjustment, User, Organisation, requireRootOrgAccess,
    PolicyUnitPurchase: { findOne: (f) => q(purchases.find((p) => p.policyId === f.policyId && p.fundId === f.fundId) || null) },
    getPolicy: () => ({ findOne: (f) => q(f.status.$in.includes(policies[f.id]?.status) ? policies[f.id] : null) }),
    PolicyFunding: { findOne: () => q(funded ? { status: "confirmed" } : null) },
    Valuation: { findOne: (f) => q(valuations.find((v) => v.fundId === f.fundId && v.valuationDate === f.valuationDate) || null) },
    logAudit: async (a) => audits.push(a) });
  const res = () => ({ code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } });
  const preview = async (u, date, fundId = "fA") => { const r = res(); await h.preview({ user: { userId: u }, params: { policyId: "P1", fundId }, query: { date }, headers: {} }, r); return r; };
  const confirm = async (u, body) => { const r = res(); await h.confirm({ user: { userId: u }, params: { policyId: "P1", fundId: "fA" }, body, headers: {} }, r); return r; };
  const list = async (u) => { const r = res(); await h.list({ user: { userId: u }, params: { policyId: "P1" }, headers: {} }, r); return r; };
  const confirmFromPreview = async (u, date) => { const p = await preview("rootAdmin", date); return confirm(u, { ...p.body, confirmed: true }); };
  return { preview, confirm, list, confirmFromPreview, adjustments, audits, valuations, unchanged: () => JSON.stringify({ purchases, valuations, policies }) === before };
}

test("formula: positive, negative and zero moves at full precision", () => {
  assert.deepEqual(marketAdjustment("100", "2", "2.123456", "200"), { adjustment: "12.3456", newClosingBalance: "212.3456" });
  assert.deepEqual(marketAdjustment("100", "2.5", "2.4", "250"), { adjustment: "-10", newClosingBalance: "240" });
  assert.deepEqual(marketAdjustment("100", "2.5", "2.5", "250"), { adjustment: "0", newClosingBalance: "250" });
});

test("preview uses purchase price/balance and the exact-date six-decimal price", async () => {
  const s = setup(); const r = await s.preview("rootAdmin", "2026-01-31");
  assert.equal(r.code, 200);
  assert.equal(r.body.previousUnitPrice, "2.5"); assert.equal(r.body.newUnitPrice, "2.612345");
  assert.equal(r.body.unitsHeld, "400.123456789");
  assert.equal(r.body.adjustment, "44.951869752960205"); // 400.123456789 × 0.112345
  assert.equal(r.body.newClosingBalance, "1045.261869752960205");
  assert.ok(s.unchanged()); assert.equal(s.adjustments.length, 0); assert.equal(s.audits.length, 0);
});

test("no fallback when no price exists for the exact date", async () => {
  const r = await setup().preview("rootAdmin", "2026-01-30");
  assert.equal(r.code, 404); assert.equal(r.body.code, "PRICE_NOT_FOUND");
});

test("requires initial purchase and confirmed funding", async () => {
  assert.equal((await setup({ purchase: false }).preview("rootAdmin", "2026-01-31")).body.code, "NO_PURCHASE");
  assert.equal((await setup({ funded: false }).preview("rootAdmin", "2026-01-31")).body.code, "FUNDING_NOT_CONFIRMED");
});

for (const u of ["super", "rootAdmin"]) test(`${u} confirms; chain uses previous adjustment; units unchanged`, async () => {
  const s = setup();
  assert.equal((await s.confirmFromPreview(u, "2026-01-31")).code, 201);
  const r2 = await s.confirmFromPreview(u, "2026-02-28");
  assert.equal(r2.code, 201);
  const [a1, a2] = s.adjustments;
  assert.equal(a2.previousUnitPrice, a1.newUnitPrice); assert.equal(a2.previousClosingBalance, a1.newClosingBalance);
  assert.equal(a2.unitsHeld, "400.123456789"); assert.equal(a1.unitsHeld, a2.unitsHeld);
  assert.ok(a2.adjustment.startsWith("-"), "negative move");
  assert.equal(a2.valuationId, "v2"); assert.equal(a2.valuationRevision, 2); assert.equal(a2.sequence, 2);
  assert.equal(s.audits.length, 2); assert.ok(s.unchanged());
});

test("duplicate and out-of-order dates are rejected", async () => {
  const s = setup(); await s.confirmFromPreview("rootAdmin", "2026-02-28");
  assert.equal((await s.preview("rootAdmin", "2026-02-28")).body.code, "DUPLICATE_ADJUSTMENT");
  assert.equal((await s.preview("rootAdmin", "2026-01-31")).body.code, "OUT_OF_ORDER");
  assert.equal((await s.preview("rootAdmin", "2026-01-05")).body.code, "OUT_OF_ORDER", "before purchase");
});

test("stale preview is rejected", async () => {
  const s = setup(); const p = await s.preview("rootAdmin", "2026-01-31");
  s.valuations[0].revision = 5; s.valuations[0].unitPrice = "2.7";
  const r = await s.confirm("rootAdmin", { ...p.body, confirmed: true });
  assert.equal(r.code, 409); assert.equal(r.body.code, "PREVIEW_STALE"); assert.equal(s.adjustments.length, 0);
});

test("explicit confirmation required", async () => {
  const s = setup(); const p = await s.preview("rootAdmin", "2026-01-31");
  assert.equal((await s.confirm("rootAdmin", { ...p.body })).body.code, "NOT_CONFIRMED");
});

test("concurrent confirmations record only one", async () => {
  const s = setup(); const p = await s.preview("rootAdmin", "2026-01-31");
  const rs = await Promise.all([1, 2].map(() => s.confirm("rootAdmin", { ...p.body, confirmed: true })));
  assert.deepEqual(rs.map((r) => r.code).sort(), [201, 409]); assert.equal(s.adjustments.length, 1);
});

for (const u of ["advisor", "externalAdmin"]) test(`${u} cannot preview or confirm`, async () => {
  const s = setup();
  assert.equal((await s.preview(u, "2026-01-31")).code, 403);
  assert.equal((await s.confirm(u, { confirmed: true, valuationDate: "2026-01-31" })).code, 403);
  assert.equal(s.adjustments.length, 0);
});

test("advisor can list adjustments", async () => {
  const s = setup(); await s.confirmFromPreview("rootAdmin", "2026-01-31");
  const r = await s.list("advisor"); assert.equal(r.code, 200); assert.equal(r.body.length, 1);
});
