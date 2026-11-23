const { test } = require("node:test")
const assert = require("node:assert/strict")
const ts = require("typescript")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")
const src = ts.transpileModule(readFileSync(join(__dirname, "investmentStatement.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const m = { exports: {} }; new Function("module", "exports", "require", src)(m, m.exports, require)
const { buildStatement, formatUnits, formatPrice, formatMoney } = m.exports
const p = (o) => ({ fundId: "f1", purchaseDate: "2026-03-01", investmentAmount: "1000.00", unitPrice: "2.123456", units: "470.9325861106612524136649570588374", closingBalance: "1000.00", ...o })

test("no purchase gives no rows", () => assert.deepEqual(buildStatement([], "f1"), []))
test("initial purchase maps stored values exactly", () => {
  const [r] = buildStatement([p()], "f1")
  assert.equal(r.description, "Net Investment Amount")
  assert.equal(r.units, "470.9325861106612524136649570588374")
  assert.equal(formatUnits(r.units), "470.93")
  assert.equal(formatPrice(r.unitPrice), "BWP 2.123456")
  assert.equal(formatMoney(r.marketValue), "BWP 1,000.00")
  assert.equal(r.closingBalance, "1000.00")
})
test("other fund excluded", () => assert.equal(buildStatement([p({ fundId: "f2" })], "f1").length, 0))
test("chronological order", () => {
  const rows = buildStatement([p({ purchaseDate: "2026-05-01" }), p({ purchaseDate: "2026-01-01" })], "f1")
  assert.deepEqual(rows.map((r) => r.date), ["2026-01-01", "2026-05-01"])
})
test("rounds half-up and brackets negatives", () => {
  assert.equal(formatUnits("442642.3793752841"), "442,642.38")
  assert.equal(formatMoney("-12.345"), "(BWP 12.35)")
})
const { latestClosingBalance } = m.exports
const adj = (o) => ({ fundId: "f1", valuationDate: "2026-04-01", newUnitPrice: "2.2", adjustment: "-35.5", newClosingBalance: "964.50", ...o })
test("market adjustment row: blank units, signed movement, stored balance", () => {
  const rows = buildStatement([p()], "f1", [adj()])
  assert.equal(rows[1].description, "Market Price Adjustment")
  assert.equal(rows[1].units, null)
  assert.equal(formatMoney(rows[1].marketValue), "(BWP 35.50)")
  assert.equal(latestClosingBalance(rows), "964.50")
})
test("adjustments interleave chronologically and other funds excluded", () => {
  const rows = buildStatement([p()], "f1", [adj({ valuationDate: "2026-06-01", newClosingBalance: "9" }), adj(), adj({ fundId: "f2" })])
  assert.deepEqual(rows.map((r) => r.date), ["2026-03-01", "2026-04-01", "2026-06-01"])
  assert.equal(latestClosingBalance(rows), "9")
})
