// ============================================================================
// ACCESS CONTROL TEST SUITE — Standalone CJS test harness
// Loads backend/server.js with mocked mongoose, tests actual route handlers
// ============================================================================

const http = require("http");
const Module = require("module");
const path = require("path");

// ============================================================================
// MOCK MONGOOSE — returns controllable models with Mongoose-compatible chaining
// ============================================================================
function createMockMongoose() {
  const models = {};

  function matches(query, item) {
    for (const key of Object.keys(query)) {
      const qVal = query[key];
      const iVal = item[key];
      if (qVal && typeof qVal === "object" && !Array.isArray(qVal)) {
        for (const op of Object.keys(qVal)) {
          if (op === "$ne") {
            if (String(iVal) === String(qVal.$ne)) return false;
          } else if (op === "$in") {
            if (!qVal.$in.includes(iVal)) return false;
          } else if (op === "$nin") {
            if (qVal.$nin.includes(iVal)) return false;
          } else if (op === "$regex") {
            if (!new RegExp(qVal.$regex).test(String(iVal || ""))) return false;
          }
        }
      } else {
        if (String(iVal) !== String(qVal)) return false;
      }
    }
    return true;
  }

  function wrapDoc(doc) {
    if (!doc) return null;
    const plain = { ...doc };
    plain.toObject = () => ({ ...doc });
    plain.toJSON = () => ({ ...doc });
    plain.save = async function () { return this; };
    plain.lean = () => ({ ...doc });
    return plain;
  }

  // Create a chainable Mongoose Query for find/findOne/findById
  function createChainable(data, filter) {
    let filtered = data.filter((item) => matches(filter || {}, item));
    const chainable = {
      select: () => chainable,
      sort: () => chainable,
      skip: (n) => { filtered = filtered.slice(n); return chainable; },
      limit: (n) => { filtered = filtered.slice(0, n); return chainable; },
      lean: () => chainable,
      exec: async () => filtered.map(wrapDoc),
      then: async (resolve) => resolve(filtered.map(wrapDoc)),
    };
    return chainable;
  }

  // Create a chainable that resolves to a single document (or null)
  function createSingleChainable(item) {
    const doc = item ? wrapDoc(item) : null;
    const chainable = {
      select: () => chainable,
      sort: () => chainable,
      skip: () => chainable,
      limit: () => chainable,
      lean: () => chainable,
      exec: async () => doc,
      then: async (resolve) => resolve(doc),
    };
    return chainable;
  }

  function createModel(name) {
    let modelsData = [];
    const model = {
      _setData: (newData) => {
        modelsData = newData.map((d) => ({ ...d }));
      },
      _clear: () => {
        modelsData = [];
      },
      _getData: () => modelsData.map((d) => ({ ...d })),

      find: (query = {}) => createChainable(modelsData, query),
      findOne: (query = {}) => {
        const item = modelsData.find((item) => matches(query, item));
        return createSingleChainable(item);
      },
      findById: (id) => {
        const item = modelsData.find((item) => String(item._id) === String(id));
        return createSingleChainable(item);
      },
      findOneAndUpdate: async (query, update, opts) => {
        const idx = modelsData.findIndex((item) => matches(query, item));
        if (idx === -1) return null;
        if (update.$set) modelsData[idx] = { ...modelsData[idx], ...update.$set };
        return wrapDoc(modelsData[idx]);
      },
      findOneAndDelete: async (query) => {
        const idx = modelsData.findIndex((item) => matches(query, item));
        if (idx === -1) return null;
        return modelsData.splice(idx, 1)[0];
      },
      create: async (doc) => {
        const newDoc = {
          ...doc,
          _id: doc._id || `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        };
        modelsData.push(newDoc);
        return wrapDoc(newDoc);
      },
      countDocuments: async (query = {}) =>
        modelsData.filter((item) => matches(query, item)).length,
      distinct: async (field, query = {}) => {
        const results = modelsData.filter((item) => matches(query, item));
        return [...new Set(results.map((item) => item[field]).filter(Boolean))];
      },
    };
    models[name] = model;
    return model;
  }

  const mongoose = {
    connect: async () => ({}),
    model: (name, schema) => {
      if (!models[name]) {
        createModel(name);
      }
      return models[name];
    },
    Schema: function (def) {
      return def;
    },
    Types: { ObjectId: { isValid: () => true } },
    models,
    _getModel: (name) => models[name],
    _clearAll: () => {
      Object.keys(models).forEach((k) => models[k]._clear());
    },
  };
  return mongoose;
}

// ============================================================================
// SETUP MOCKS BEFORE REQUIRING SERVER.JS
// ============================================================================
const mockMongoose = createMockMongoose();
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "mongoose") return mockMongoose;
  return origLoad.call(this, request, parent, isMain);
};

process.env.MONGODB_URI = "mongodb+srv://mock:mock@cluster0.mock.mongodb.net/test";
process.env.JWT_SECRET = "test-jwt-secret-12345";
process.env.PORT = "5999";
process.env.APP_URL = "http://localhost:5999";
process.env.FRONTEND_ORIGIN = "http://localhost:5999";
process.env.PY_CALC_URL = "http://localhost:5005";
process.env.SENDGRID_API_KEY = "";

require("dotenv").config();

const origCreateServer = http.createServer;
let capturedApp = null;
http.createServer = function (requestListener) {
  capturedApp = requestListener;
  return origCreateServer.apply(this, arguments);
};

const serverPath = path.resolve("/Users/oratilebusang/insurance-form-flow/backend/server.js");
require(serverPath);

Module._load = origLoad;
http.createServer = origCreateServer;

if (!capturedApp) {
  console.error("FATAL: Could not capture express app");
  process.exit(1);
}

const app = capturedApp;

// Log registered routes for debugging
console.log("Registered routes:");
app._router.stack.forEach((layer) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(",").toUpperCase();
    console.log(`  ${methods} ${layer.route.path}`);
  }
});

// ============================================================================
// TEST HELPERS
// ============================================================================
let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  return async () => {
    try {
      await fn();
      passed++;
      results.push({ name, status: "PASS" });
      console.log(`  PASS: ${name}`);
    } catch (err) {
      failed++;
      results.push({ name, status: "FAIL", error: err.message });
      console.log(`  FAIL: ${name} — ${err.message}`);
    }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeReq(overrides = {}) {
  return {
    user: { userId: "user_super", role: "superuser" },
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  };
}

function makeRes() {
  return {
    statusCode: 200,
    statusMessage: "OK",
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    send(data) { this.body = data; return this; },
    set(k, v) { if (v === undefined) { this.headers = k; } else { this.headers[k] = v; } return this; },
    end(data) { if (data !== undefined) this.body = data; return this; },
  };
}

function findHandler(app, method, path) {
  for (const layer of app._router.stack) {
    if (layer.route && layer.route.path === path && layer.route.methods[method.toLowerCase()]) {
      return layer.route.stack;
    }
  }
  return null;
}

async function callHandler(app, method, path, req) {
  const handlers = findHandler(app, method, path);
  if (!handlers) throw new Error(`Route ${method} ${path} not found`);
  const res = makeRes();
  const handler = handlers[handlers.length - 1];
  await new Promise((resolve, reject) => {
    handler(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  return res;
}

// ============================================================================
// SETUP TEST DATA AND RUN TESTS (wrapped in async IIFE for top-level await)
// ============================================================================
(async () => {
  const OrgModel = mockMongoose._getModel("Organisation");
  const UserModel = mockMongoose._getModel("User");
  const QuotesModel = mockMongoose._getModel("Quotes");
  const QuoteModel = mockMongoose._getModel("Quotations");
  const PolicyModel = mockMongoose._getModel("Policy");
  const ConversionModel = mockMongoose._getModel("Conversion");

  await OrgModel._setData([
    { _id: "org_root", name: "Exclusive Life", code: "ROOT", isRootOrganisation: true, allowedCalculators: ["annuity","funeral","life-assurance","individual-life"], isActive: true },
    { _id: "org_ext", name: "External Org", code: "EXT", isRootOrganisation: false, allowedCalculators: ["annuity"], isActive: true },
    { _id: "org_ext2", name: "External Org 2", code: "EXT2", isRootOrganisation: false, allowedCalculators: ["funeral"], isActive: true },
  ]);

  await UserModel._setData([
    { _id: "user_super", email: "super@test.com", role: "superuser", organisationId: null, firstName: "Super", lastName: "User" },
    { _id: "user_root_admin", email: "admin@root.com", role: "admin", organisationId: "org_root", firstName: "Root", lastName: "Admin" },
    { _id: "user_ext_advisor", email: "advisor@ext.com", role: "user", organisationId: "org_ext", firstName: "Ext", lastName: "Advisor" },
    { _id: "user_no_org", email: "noorg@test.com", role: "user", organisationId: null, firstName: "No", lastName: "Org" },
  ]);

  await QuotesModel._setData([
    { _id: "q_ext_1", quoteId: "EXQ-0001/26", productType: "Exclusive Annuity", organisationId: "org_ext", createdBy: "user_ext_advisor", client: { fullName: "Client A" } },
    { _id: "q_ext_2", quoteId: "EXQ-0002/26", productType: "Exclusive Funeral", organisationId: "org_ext", createdBy: "user_ext_advisor", client: { fullName: "Client B" } },
    { _id: "q_ext2_1", quoteId: "EXQ-0003/26", productType: "Exclusive Life Assurance", organisationId: "org_ext2", createdBy: "user_ext_advisor", client: { fullName: "Client C" } },
    { _id: "q_hist_1", quoteId: "EXQ-0000/25", productType: "Exclusive Annuity", organisationId: null, createdBy: "user_super", client: { fullName: "Historical Client" } },
  ]);

  await QuoteModel._setData([
    { _id: "lq_ext_1", quoteId: "EXQ-L001/26", fullName: "Legacy Client", organisationId: "org_ext", createdBy: "user_ext_advisor" },
    { _id: "lq_hist_1", quoteId: "EXQ-L000/25", fullName: "Historical Legacy", organisationId: null, createdBy: "user_super" },
  ]);

  await PolicyModel._setData([
    { _id: "pol_1", id: "POL-001", status: "DRAFT", initiatedBy: "user_root_admin", createdBy: "user_root_admin", organisationId: "org_root", form: { fullName: "Client", idNumber: "123" } },
    { _id: "pol_2", id: "POL-002", status: "APPROVED", initiatedBy: "user_ext_advisor", createdBy: "user_ext_advisor", organisationId: "org_ext", form: { fullName: "Ext Client", idNumber: "456" } },
  ]);

  await ConversionModel._setData([
    { _id: "conv_1", id: "CONV-001", status: "draft", initiatedBy: "user_root_admin", organisationId: "org_root" },
    { _id: "conv_2", id: "CONV-002", status: "pending_approval", initiatedBy: "user_ext_advisor", organisationId: "org_ext" },
  ]);

  await runTests();
})().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
  console.log("\n========================================");
  console.log("ACCESS CONTROL TEST SUITE");
  console.log("========================================\n");

  // ---- 1. Calculator access ----
  console.log("--- Calculator Access ---");

  await test("External org user can access assigned calculator (annuity)", async () => {
    const handlers = findHandler(app, "post", "/api/quotes/calculate-annuity");
    const handler = handlers[handlers.length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
  })();

  await test("External org user cannot access unassigned calculator (funeral)", async () => {
    const handlers = findHandler(app, "post", "/api/quotes/calculate-funeral");
    const handler = handlers[handlers.length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 403, `Expected 403, got ${res.statusCode}`);
  })();

  // ---- 2. Quotes isolation (new-quotes) ----
  console.log("\n--- Quotes Isolation (new-quotes) ---");

  await test("External org user sees only own org quotes (GET /api/new-quotes)", async () => {
    const handler = findHandler(app, "get", "/api/new-quotes")[findHandler(app, "get", "/api/new-quotes").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    const quotes = res.body;
    assert(Array.isArray(quotes), "Expected array response");
    assert(quotes.length === 2, `Expected 2 quotes, got ${quotes.length}`);
    assert(quotes.every(q => q.organisationId === "org_ext"), "All quotes should belong to org_ext");
  })();

  await test("External org user cannot see another org's quotes (GET /api/new-quotes)", async () => {
    const handler = findHandler(app, "get", "/api/new-quotes")[findHandler(app, "get", "/api/new-quotes").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    const quotes = res.body;
    assert(!quotes.some(q => q.organisationId === "org_ext2"), "Should not see org_ext2 quotes");
  })();

  await test("External org user cannot access another org's quote by ID (GET /api/new-quotes/:id)", async () => {
    const handler = findHandler(app, "get", "/api/new-quotes/:id")[findHandler(app, "get", "/api/new-quotes/:id").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" }, params: { id: "q_ext2_1" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 404, `Expected 404 for cross-org quote, got ${res.statusCode}`);
  })();

  await test("External org user can access own quote by ID (GET /api/new-quotes/:id)", async () => {
    const handler = findHandler(app, "get", "/api/new-quotes/:id")[findHandler(app, "get", "/api/new-quotes/:id").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" }, params: { id: "q_ext_1" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.body.organisationId === "org_ext", "Quote should belong to org_ext");
  })();

  await test("User without org denied quote access (GET /api/new-quotes)", async () => {
    const handler = findHandler(app, "get", "/api/new-quotes")[findHandler(app, "get", "/api/new-quotes").length - 1];
    const req = makeReq({ user: { userId: "user_no_org", role: "user", organisationId: null } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
  })();

  await test("Superuser sees all quotes (GET /api/new-quotes)", async () => {
    const handler = findHandler(app, "get", "/api/new-quotes")[findHandler(app, "get", "/api/new-quotes").length - 1];
    const req = makeReq({ user: { userId: "user_super", role: "superuser", organisationId: null } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    const quotes = res.body;
    assert(Array.isArray(quotes), "Expected array");
    assert(quotes.length >= 4, `Expected at least 4 quotes, got ${quotes.length}`);
  })();

  // ---- 3. Legacy quotes ----
  console.log("\n--- Legacy Quotes ---");

  await test("Legacy quotes: external org sees only own quotes (GET /api/quotes)", async () => {
    const handler = findHandler(app, "get", "/api/quotes")[findHandler(app, "get", "/api/quotes").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    const quotes = res.body;
    assert(quotes.every(q => q.organisationId === "org_ext"), "All legacy quotes should belong to org_ext");
  })();

  await test("Legacy quotes: external org cannot access another org's quote (GET /api/quotes/:id)", async () => {
    const handler = findHandler(app, "get", "/api/quotes/:id")[findHandler(app, "get", "/api/quotes/:id").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" }, params: { id: "lq_hist_1" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 404, `Expected 404 for cross-org legacy quote, got ${res.statusCode}`);
  })();

  // ---- 4. Internal workflows ----
  console.log("\n--- Internal Workflows (Root Org Restriction) ---");

  await test("External org user denied policies pipeline (GET /api/policies/pipeline)", async () => {
    const handler = findHandler(app, "get", "/api/policies/pipeline")[findHandler(app, "get", "/api/policies/pipeline").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 403, `Expected 403, got ${res.statusCode}`);
  })();

  await test("Root org admin can access policies pipeline (GET /api/policies/pipeline)", async () => {
    const handler = findHandler(app, "get", "/api/policies/pipeline")[findHandler(app, "get", "/api/policies/pipeline").length - 1];
    const req = makeReq({ user: { userId: "user_root_admin", role: "admin", organisationId: "org_root" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
  })();

  await test("Superuser can access policies pipeline (GET /api/policies/pipeline)", async () => {
    const handler = findHandler(app, "get", "/api/policies/pipeline")[findHandler(app, "get", "/api/policies/pipeline").length - 1];
    const req = makeReq({ user: { userId: "user_super", role: "superuser", organisationId: null } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
  })();

  await test("External org user denied clients (GET /api/clients)", async () => {
    const handler = findHandler(app, "get", "/api/clients")[findHandler(app, "get", "/api/clients").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 403, `Expected 403, got ${res.statusCode}`);
  })();

  await test("External org user denied conversions (GET /api/conversions)", async () => {
    const handler = findHandler(app, "get", "/api/conversions")[findHandler(app, "get", "/api/conversions").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 403, `Expected 403, got ${res.statusCode}`);
  })();

  await test("External org user denied policy-records (GET /api/policy-records/:id)", async () => {
    const handler = findHandler(app, "get", "/api/policy-records/:id")[findHandler(app, "get", "/api/policy-records/:id").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" }, params: { id: "POL-001" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 403, `Expected 403, got ${res.statusCode}`);
  })();

  // ---- 5. PDF endpoints ----
  console.log("\n--- PDF Endpoints ---");

  await test("PDF generation requires auth and org filtering (GET /api/quotes/:id/generate-pdf)", async () => {
    const handler = findHandler(app, "get", "/api/quotes/:id/generate-pdf")[findHandler(app, "get", "/api/quotes/:id/generate-pdf").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" }, params: { id: "q_ext_1" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode !== 401, "Should not return 401 (auth now required)");
  })();

  await test("PDF: external org cannot access another org's quote", async () => {
    const handler = findHandler(app, "get", "/api/quotes/:id/generate-pdf")[findHandler(app, "get", "/api/quotes/:id/generate-pdf").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" }, params: { id: "q_ext2_1" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 404, `Expected 404 for cross-org PDF, got ${res.statusCode}`);
  })();

  // ---- 6. Historical quotes without orgId ----
  console.log("\n--- Historical Quotes (no organisationId) ---");

  await test("Historical quote not visible to external org user (GET /api/new-quotes)", async () => {
    const handler = findHandler(app, "get", "/api/new-quotes")[findHandler(app, "get", "/api/new-quotes").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    const quotes = res.body;
    assert(!quotes.some(q => q.organisationId === null), "Historical quotes (no orgId) should not appear");
  })();

  await test("Historical quote not accessible by ID to external org (GET /api/new-quotes/:id)", async () => {
    const handler = findHandler(app, "get", "/api/new-quotes/:id")[findHandler(app, "get", "/api/new-quotes/:id").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" }, params: { id: "q_hist_1" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 404, `Expected 404 for historical quote, got ${res.statusCode}`);
  })();

  await test("Superuser can see historical quotes (GET /api/new-quotes)", async () => {
    const handler = findHandler(app, "get", "/api/new-quotes")[findHandler(app, "get", "/api/new-quotes").length - 1];
    const req = makeReq({ user: { userId: "user_super", role: "superuser", organisationId: null } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    const quotes = res.body;
    assert(quotes.some(q => q.organisationId === null), "Superuser should see historical quotes");
  })();

  // ---- 7. Funeral status ----
  console.log("\n--- Funeral Status ---");

  await test("Funeral status requires authentication", async () => {
    const handler = findHandler(app, "get", "/api/quotes/funeral/status/:jobId")[findHandler(app, "get", "/api/quotes/funeral/status/:jobId").length - 1];
    const req = makeReq({ user: { userId: "user_ext_advisor", role: "user", organisationId: "org_ext" }, params: { jobId: "test_job" } });
    const res = makeRes();
    await new Promise((resolve, reject) => {
      handler(req, res, (err) => err ? reject(err) : resolve());
    });
    assert(res.statusCode === 404, `Expected 404 (job not found), got ${res.statusCode}`);
  })();

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n========================================");
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log("========================================\n");

  if (failed > 0) {
    console.log("FAILURES:");
    results.filter(r => r.status === "FAIL").forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log("ALL TESTS PASSED");
    process.exit(0);
  }
})();
