const { test } = require("node:test");
const assert = require("node:assert/strict");
const { registerFundValuations, validatePrice, validateDate } = require("./fundValuations.cjs");

test("Prices preserve six decimals and reject rounding, nonpositive and malformed values", () => {
  assert.equal(validatePrice("1.123456"), "1.123456");
  assert.equal(validatePrice("0.000001"), "0.000001");
  for (const value of ["1.1234567", "0", "0.000000", "-1", "NaN", "Infinity", "1e3", "123456789012345678901234567890123456789", 1.23]) assert.throws(() => validatePrice(value));
});
test("Valuation calendar date is validated independently of entry timestamps", () => {
  assert.equal(validateDate("2024-02-29"), "2024-02-29");
  for (const date of ["2026-02-29", "2026-11-31", "19/11/2026", "2026-11-19T10:00:00Z", "bad"]) assert.throws(() => validateDate(date));
});

function setup() {
  const routes = {}; const items = []; let role = "admin"; let root = true; let policies = []; let indexCalls = 0; let schemaIndex;
  const chain = (get) => ({ select() { return this; }, lean: async () => get(), sort() { return this; } });
  const matches = (item, query) => Object.entries(query).every(([key, value]) => value?.$in ? value.$in.includes(item[key]) : item[key] === value);
  const model = {
    createIndexes: async () => { indexCalls++; },
    create: async (data) => {
      if (items.some((item) => item.fundId === data.fundId && item.valuationDate === data.valuationDate)) throw Object.assign(new Error("duplicate"), { code: 11000 });
      const item = { ...data, _id: `valuation-${items.length}`, history: [...data.history] }; items.push(item);
      return { toObject: () => item };
    },
    find: (query) => chain(() => items.filter((item) => matches(item, query)).sort((a,b) => b.valuationDate.localeCompare(a.valuationDate))),
    findOne: (query) => chain(() => items.find((item) => matches(item, query))),
    exists: async (query) => items.some((item) => matches(item, query)),
    findOneAndUpdate: (query, update) => chain(() => {
      const item = items.find((item) => matches(item, query)); if (!item) return null;
      Object.assign(item, update.$set); item.revision += update.$inc.revision; item.history.push(update.$push.history); return item;
    }),
  };
  function Schema() { this.index = (value, options) => { schemaIndex = { value, options }; }; }
  Schema.Types = { Decimal128: "decimal", ObjectId: "objectId" };
  const mongoose = { Schema, models: {}, model: () => model, Types: { ObjectId: { isValid: (id) => !!id && id !== "bad" }, Decimal128: { fromString: (value) => ({ toString: () => value }) } } };
  const app = Object.fromEntries(["get", "post", "patch"].map((method) => [method, (path, ...handlers) => { routes[`${method} ${path}`] = handlers; }]));
  const fund = { _id: "fund-a", assetManagerId: "manager-a", name: "Money Market Fund" };
  const otherFund = { _id: "fund-b", assetManagerId: "manager-b", name: "Money Market Fund" };
  const deps = {
    app, mongoose, authenticateToken: (req, res, next) => { if (req.auth === false) res.status(401).json({ message: "Authentication required" }); else next(); },
    requireRootOrgAccess: async (req, res) => { if (!root) { res.status(403).json({ message: "External organisation" }); return null; } return true; },
    User: { findById: () => chain(() => ({ role, firstName: "Test", lastName: "Admin" })) },
    AssetManager: { findById: (id) => chain(() => ({ _id: id, name: "Manager" })) },
    AssetManagerFund: { findOne: (query) => chain(() => [fund, otherFund].find((item) => matches(item, query))), find: (query) => chain(() => [fund, otherFund].filter((item) => matches(item, query))) },
    getPolicy: () => ({ find: () => chain(() => policies) }),
  };
  const guards = registerFundValuations(deps);
  async function call(method, body = {}, params = {}, options = {}) {
    const base = "/api/asset-managers/:managerId/funds/:fundId";
    const suffix = method === "get" ? "" : method === "post" ? "/valuations" : "/valuations/:valuationId";
    const req = { user: { userId: "admin-id" }, params: { managerId: "manager-a", fundId: "fund-a", ...params }, body, ...options };
    const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    const [auth, handler] = routes[`${method} ${base}${suffix}`]; let passed = false; auth(req, res, () => { passed = true; }); if (passed) await handler(req, res);
    return res;
  }
  return { call, items, guards, setRole: (value) => { role = value; }, setRoot: (value) => { root = value; }, setPolicies: (value) => { policies = value; }, index: () => schemaIndex, indexCalls: () => indexCalls };
}
test("Actual handlers enforce authentication, server administrator role, root organisation and scoped fund IDs", async () => {
  const state = setup();
  assert.equal((await state.call("get", {}, {}, { auth: false })).code, 401);
  state.setRole("user"); assert.equal((await state.call("get")).code, 403);
  state.setRole("admin"); state.setRoot(false); assert.equal((await state.call("get")).code, 403);
  state.setRoot(true); assert.equal((await state.call("get", {}, { managerId: "manager-b" })).code, 404);
  assert.equal((await state.call("get", {}, { fundId: "bad" })).code, 400);
});
test("Unique fund/date index is established before recording; same-name funds remain independent", async () => {
  const state = setup(); const input = { unitPrice: "1.123456", valuationDate: "2026-11-19" };
  assert.equal((await state.call("post", input)).code, 201);
  assert.deepEqual(state.index(), { value: { fundId: 1, valuationDate: 1 }, options: { unique: true } });
  assert.equal(state.indexCalls(), 1);
  assert.equal((await state.call("post", input)).code, 409);
  assert.equal((await state.call("post", input, { fundId: "fund-b", managerId: "manager-b" })).code, 201);
  assert.equal(state.items.length, 2);
});
test("Corrections preserve original and every revision with reason, actor, timestamp and stale-write rejection", async () => {
  const state = setup(); const recorded = await state.call("post", { unitPrice: "1.123456", valuationDate: "2026-11-19", administratorId: "spoofed" });
  const params = { valuationId: recorded.data._id };
  assert.equal((await state.call("patch", { unitPrice: "1.2", revision: 1, reason: " " }, params)).code, 400);
  const first = await state.call("patch", { unitPrice: "1.234567", revision: 1, reason: "Correct source" }, params);
  assert.equal(first.code, 200); assert.equal(first.data.history[0].replacementPrice, "1.123456");
  assert.equal(first.data.history[1].previousPrice, "1.123456"); assert.equal(first.data.history[1].replacementPrice, "1.234567");
  assert.equal(first.data.history[1].reason, "Correct source"); assert.equal(first.data.history[1].administratorId, "admin-id"); assert.ok(first.data.history[1].recordedAt instanceof Date);
  assert.equal((await state.call("patch", { unitPrice: "2", revision: 1, reason: "Stale" }, params)).code, 409);
  const second = await state.call("patch", { unitPrice: "1.345678", revision: 2, reason: "Second correction", valuationDate: "2026-12-01" }, params);
  assert.equal(second.data.history.length, 3); assert.equal(second.data.history[2].previousPrice, "1.234567"); assert.equal(second.data.valuationDate, "2026-11-19");
});
test("Latest valuation follows valuation date, not order entered or corrected", async () => {
  const state = setup(); await state.call("post", { unitPrice: "2", valuationDate: "2026-11-19" }); await state.call("post", { unitPrice: "1", valuationDate: "2026-11-01" });
  const response = await state.call("get"); assert.equal(response.data.valuations[0].unitPrice, "2");
});
test("Deletion guards retain funds and managers with history or policy relationships", async () => {
  const state = setup();
  async function guard(fn, params) { let next = false; const res = { code: 200, status(value) { this.code = value; return this; }, json() {} }; await fn({ params, user: { userId: "admin-id" } }, res, () => { next = true; }); return { next, code: res.code }; }
  state.setPolicies([{ form: { portfolioAllocations: '{"fund-a":"100"}' } }]);
  assert.equal((await guard(state.guards.protectFundDeletion, { fundId: "fund-a" })).code, 409);
  assert.equal((await guard(state.guards.protectManagerDeletion, { id: "manager-a" })).code, 409);
  state.setPolicies([]); await state.call("post", { unitPrice: "1", valuationDate: "2026-11-19" });
  assert.equal((await guard(state.guards.protectFundDeletion, { fundId: "fund-a" })).code, 409);
  assert.equal((await guard(state.guards.protectFundDeletion, { fundId: "fund-b" })).next, true);
});