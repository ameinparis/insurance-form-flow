const { test } = require("node:test")
const assert = require("node:assert/strict")
const ts = require("typescript")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")
const out = ts.transpileModule(readFileSync(join(__dirname, "permissions.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const m = { exports: {} }; new Function("exports", "module", out)(m.exports, m)
const { canManageFundingFor, permissionsFor, canApproveConversion } = m.exports
const { investmentPermissionsFor } = m.exports

test("Funding management: Super Admin and Root Admin only", () => {
  assert.equal(canManageFundingFor("superuser", false), true)
  assert.equal(canManageFundingFor("admin", true), true)
  assert.equal(canManageFundingFor("admin", false), false)
  assert.equal(canManageFundingFor("user", true), false)
  assert.equal(canManageFundingFor("user", false), false)
  assert.equal(canManageFundingFor("", true), false)
})
test("Existing role permissions are unchanged and funding is off by default", () => {
  assert.deepEqual(permissionsFor("superuser"), { role: "super_admin", canManageUsers: true, canManageSuperAdmins: true, canConfigureFees: true, canManageInvestments: true, canApprove: true, canApproveOwn: true, canManageFunding: false })
  assert.deepEqual(permissionsFor("admin"), { role: "admin", canManageUsers: true, canManageSuperAdmins: false, canConfigureFees: true, canManageInvestments: true, canApprove: true, canApproveOwn: false, canManageFunding: false })
  assert.deepEqual(permissionsFor("user"), { role: "advisor", canManageUsers: false, canManageSuperAdmins: false, canConfigureFees: false, canManageInvestments: false, canApprove: false, canApproveOwn: false, canManageFunding: false })
  assert.equal(canApproveConversion("admin", "a", "b"), true)
  assert.equal(canApproveConversion("user", "a", "b"), false)
})

test("Investment UI definitions match backend rules without changing existing role permissions", () => {
  const backend = require("../../../backend/investmentAccess.cjs")
  for (const role of ["superuser", "admin", "user", "unknown", "", null]) {
    for (const root of [true, false]) {
      for (const access of [true, false]) {
        const before = permissionsFor(role)
        assert.deepEqual(investmentPermissionsFor(role, root, access), backend.investmentPermissionsFor(role, root, access))
        assert.deepEqual(permissionsFor(role), before)
      }
    }
  }
})
test("Advisor submission is policy-scoped, never transaction approval or execution", () => {
  assert.deepEqual(investmentPermissionsFor("user", true, true), {
    canViewInvestments: true, canSubmitInvestmentRequests: true,
    canAuthoriseInvestmentTransactions: false, canExecuteInvestmentTransactions: false,
  })
  assert.equal(investmentPermissionsFor("user", true, false).canSubmitInvestmentRequests, false)
})
test("External Admin only sees already-authorised investments, with no financial authority", () => {
  assert.deepEqual(investmentPermissionsFor("admin", false, true), {
    canViewInvestments: true, canSubmitInvestmentRequests: false,
    canAuthoriseInvestmentTransactions: false, canExecuteInvestmentTransactions: false,
  })
  assert.equal(investmentPermissionsFor("admin", false, false).canViewInvestments, false)
})
test("Root Admin has policy-scoped investment authority and Super Admin has oversight", () => {
  assert.equal(investmentPermissionsFor("admin", true, true).canExecuteInvestmentTransactions, true)
  assert.equal(investmentPermissionsFor("admin", true, false).canExecuteInvestmentTransactions, false)
  assert.equal(investmentPermissionsFor("superuser", false, false).canAuthoriseInvestmentTransactions, true)
})
