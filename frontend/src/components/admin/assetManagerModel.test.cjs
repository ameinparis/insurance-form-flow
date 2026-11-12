const { test } = require("node:test")
const assert = require("node:assert/strict")
const ts = require("typescript")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")
const compiled = ts.transpileModule(readFileSync(join(__dirname, "assetManagerModel.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const model = { exports: {} }
new Function("exports", "module", compiled)(model.exports, model)
const { FUND_TYPES, RISK_LEVELS, saveFund } = model.exports

test("Funds provide the six requested classifications", () => {
  assert.deepEqual(FUND_TYPES, ["Money Market", "Prudential", "Balanced", "Equity", "Fixed Income / Bond", "Other"])
})
test("Risk classification provides the five requested levels", () => {
  assert.deepEqual(RISK_LEVELS, ["Low", "Low–Moderate", "Moderate", "Moderate–High", "High"])
})
test("Same-name funds remain separate under their respective managers", () => {
  const first = { id: "kgori-fund", name: "Money Market Fund", risk: "Low", status: "Active" }
  const second = { id: "vunani-fund", name: "Money Market Fund", risk: "Moderate", status: "Inactive" }
  const managers = [{ id: "kgori", funds: [first] }, { id: "vunani", funds: [] }]
  const added = saveFund(managers, "vunani", second)
  assert.deepEqual(added[0].funds, [first])
  assert.deepEqual(added[1].funds, [second])
  const edited = saveFund(added, "kgori", { ...first, risk: "High" })
  assert.equal(edited[0].funds[0].risk, "High")
  assert.equal(edited[1].funds[0].risk, "Moderate")
  assert.equal(edited[0].funds.length, 1)
  assert.equal(managers[0].funds[0].risk, "Low")
})