const { test } = require("node:test")
const assert = require("node:assert/strict")
const ts = require("typescript")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")
const compiled = ts.transpileModule(readFileSync(join(__dirname, "unitPrice.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const model = { exports: {} }
new Function("exports", "module", compiled)(model.exports, model)
test("Unit price display retains all six decimal places without binary rounding", () => {
  assert.equal(model.exports.formatUnitPrice("1.123456"), "BWP 1.123456")
  assert.equal(model.exports.formatUnitPrice("0.000001"), "BWP 0.000001")
  assert.equal(model.exports.formatUnitPrice("1234567890123456789012345678.123456"), "BWP 1,234,567,890,123,456,789,012,345,678.123456")
})