const { test } = require("node:test")
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")

test("Exclusive Annuity uses the requested nine-step sequence", () => {
  const source = readFileSync(join(__dirname, "ConvertToPolicy.tsx"), "utf8")
  const commonSteps = source.match(/const STEPS: string\[\] = \[([\s\S]*?)\]/)
  assert.ok(commonSteps, "The wizard must define its shared step sequence")
  const annuityStep = source.match(/prefill\.productType === "Exclusive Annuity"[^\n]*\? \["([^"]+)"\]/)
  assert.ok(annuityStep, "Exclusive Annuity must include its guarantee selection step")
  const steps = [annuityStep[1], ...Array.from(commonSteps[1].matchAll(/"([^"]+)"/g), (match) => match[1])]
  assert.deepEqual(steps, [
    "Life Annuity Guarantee Selection",
    "Policyholder Details",
    "Policy Details",
    "Premium and Policy Fees",
    "Salary Details & Income Configuration",
    "Investment Portfolio Setup",
    "Beneficiaries",
    "Documents",
    "Review",
  ])
})