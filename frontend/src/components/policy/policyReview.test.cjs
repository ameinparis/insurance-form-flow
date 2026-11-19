const { test } = require("node:test")
const assert = require("node:assert/strict")
const ts = require("typescript")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")
const compiled = ts.transpileModule(readFileSync(join(__dirname, "policyReview.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const model = { exports: {} }
new Function("exports", "module", compiled)(model.exports, model)
const { readPolicyReview, buildPortfolioReview, readSavedPortfolio, readApprovalReview } = model.exports

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

const funds = [
  { id: "money", name: "Money Market Fund", assetManagerName: "Submitted Manager A" },
  { id: "prudential", name: "Managed Prudential Fund", assetManagerName: "Submitted Manager B" },
]
const savedForm = {
  investmentAmount: "2000000", netInvestment: "1947500.00",
  selectedFunds: JSON.stringify(funds), portfolioAllocations: '{"money":"30","prudential":"70"}',
}
test("Legacy approval reads saved funds and managers using net investment, not gross investment", () => {
  const section = readSavedPortfolio(savedForm)
  assert.deepEqual(section.rows, [
    { name: "Money Market Fund", detail: "Submitted Manager A", value: "30% — BWP 584,250.00" },
    { name: "Managed Prudential Fund", detail: "Submitted Manager B", value: "70% — BWP 1,363,250.00" },
  ])
  assert.equal(section.fields[0].value, "BWP 1,947,500.00")
  assert.equal(section.fields[1].value, "100%")
})
test("Independent saved portfolio snapshot preserves exact submitted amounts despite later form changes", () => {
  const section = buildPortfolioReview({ funds, allocations: { money: "30", prudential: "70" }, netInvestment: 1947500 })
  const form = { ...savedForm, netInvestment: "9000000", selectedFunds: "[]", portfolioReviewSnapshot: JSON.stringify({ version: 1, sections: [section] }) }
  assert.deepEqual(readSavedPortfolio(form), section)
})
test("Approval supplements missing and empty portfolio sections without dropping other submitted details", () => {
  const fees = { title: "Premium and Policy Fees", fields: [{ label: "Net Investment Amount", value: "BWP 1,947,500.00" }] }
  for (const sections of [[fees], [fees, { title: "Investment Portfolio Setup", rows: [] }]]) {
    const review = readApprovalReview({ ...savedForm, reviewSnapshot: JSON.stringify({ version: 1, sections }) })
    assert.deepEqual(review.sections[0], fees)
    assert.deepEqual(review.sections[1], readSavedPortfolio(savedForm))
  }
})
test("Complete review snapshot stays authoritative despite changed saved fund data", () => {
  const portfolio = { title: "Investment Portfolio Setup", rows: [{ name: "Original Fund", detail: "Original Manager", value: "100% — BWP 123.45" }] }
  const review = { version: 1, sections: [portfolio] }
  assert.deepEqual(readApprovalReview({ ...savedForm, reviewSnapshot: JSON.stringify(review) }), review)
})
test("Missing saved net investment never falls back to gross investment", () => {
  const section = readSavedPortfolio({ ...savedForm, netInvestment: "" })
  assert.equal(section.fields[0].value, "Not recorded")
  assert.equal(section.rows[0].value, "30% — Amount not recorded")
})
test("Malformed saved funds do not crash legacy approval", () => {
  for (const selectedFunds of ["bad json", "null", "[null]", '[{"name":"Missing ID"}]']) {
    assert.equal(readSavedPortfolio({ ...savedForm, selectedFunds }), null)
  }
})