const { test } = require("node:test")
const assert = require("node:assert/strict")
const ts = require("typescript")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")
const compiled = ts.transpileModule(readFileSync(join(__dirname, "policyReview.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const model = { exports: {} }
new Function("exports", "module", compiled)(model.exports, model)
const { readPolicyReview } = model.exports

test("Submission round-trip preserves all preview values, including net investment and allocations", () => {
  const snapshot = { version: 1, sections: [
    { title: "Policyholder Details", fields: [{ label: "Full Name", value: "Test Policyholder" }, { label: "Address", value: "Submitted address", full: true }] },
    { title: "Premium and Policy Fees", fields: [{ label: "Net Investment Amount", value: "BWP 1,947,500.00" }, { label: "Upfront Commission", value: "Not applied" }] },
    { title: "Investment Portfolio Setup", fields: [{ label: "Notes", value: "Submitted notes" }], rows: [{ name: "Money Market Fund", detail: "Kgori Capital", value: "60% — BWP 1,168,500.00" }, { name: "Money Market Fund", detail: "Vunani Fund Managers", value: "40% — BWP 779,000.00" }] },
    { title: "Beneficiaries", rows: [{ name: "Test Beneficiary", detail: "Spouse • Lump Sum", value: "100%" }] },
    { title: "Documents", documents: [{ key: "identity", label: "Identity document", name: "identity.pdf", uploaded: true }] },
  ] }
  const form = JSON.parse(JSON.stringify({ reviewSnapshot: JSON.stringify(snapshot), documents: JSON.stringify({ identity: JSON.stringify({ name: "identity.pdf", data: "data:application/pdf;base64,AA==" }) }) }))
  assert.deepEqual(readPolicyReview(form.reviewSnapshot), snapshot)
  assert.equal(JSON.parse(JSON.parse(form.documents).identity).data, "data:application/pdf;base64,AA==")
})
test("Legacy records and invalid snapshots use the existing preview fallback", () => {
  for (const value of [undefined, "bad json", '{"version":2,"sections":[]}', '{"version":1,"sections":[{"title":"Fees","fields":[{"value":12}]}]}']) assert.equal(readPolicyReview(value), null)
})