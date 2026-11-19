const { test } = require("node:test")
const assert = require("node:assert/strict")
const ts = require("typescript")
const { readFileSync } = require("node:fs")
const { join } = require("node:path")
const out = ts.transpileModule(readFileSync(join(__dirname, "permissions.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const m = { exports: {} }; new Function("exports", "module", out)(m.exports, m)
const { canManageFundingFor, permissionsFor, canApproveConversion } = m.exports

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
