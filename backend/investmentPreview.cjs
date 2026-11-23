/**
 * Phase 1 only: read-only validation. Not registered as an API or imported by
 * server.js. No funding, policy, valuation, purchase or activation writes.
 */
const DecimalJs = require("decimal.js");
const Decimal = DecimalJs.clone({ precision: 80, rounding: DecimalJs.ROUND_HALF_UP });
const { createHash } = require("node:crypto");
const { validatePrice } = require("./fundValuations.cjs");

const fail = (message) => { throw new Error(`Activation input requires review: ${message}`); };
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function amount(value, label) {
  if (typeof value !== "string" || value.length > 40 ||
      !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) fail(`${label} must be a saved decimal amount, not a derived value`);
  const result = new Decimal(value);
  if (result.lte(0) || result.sd() > 34) fail(`${label} must be positive and fit decimal storage`);
  return result;
}

function percent(value) {
  if (typeof value !== "string" || value.length > 40 ||
      !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) fail("invalid saved allocation percentage");
  const result = new Decimal(value);
  if (result.lte(0) || result.gt(100) || result.sd() > 34) fail("invalid saved allocation percentage");
  return result;
}

function json(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} is missing`);
  try { return JSON.parse(value); } catch { fail(`${label} is malformed`); }
}

function savedCurrency(value, label) {
  if (typeof value !== "string" || !/^BWP (?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)\.\d{2}$/.test(value))
    fail(`${label} is not an unambiguous submitted BWP amount`);
  return amount(value.slice(4).replace(/,/g, ""), label);
}

function portfolio(value, label) {
  if (!value) return null;
  const snapshot = json(value, label);
  if (!object(snapshot) || snapshot.version !== 1 || !Array.isArray(snapshot.sections)) fail(`${label} is unsupported`);
  const sections = snapshot.sections.filter((section) => section?.title === "Investment Portfolio Setup");
  if (sections.length > 1) fail(`${label} contains duplicate portfolio sections`);
  return sections[0] || null;
}

function readRows(section, selected, allocations, net) {
  if (section.badge === "Skipped" || !Array.isArray(section.rows) || section.rows.length !== selected.length)
    fail("portfolio is skipped or incomplete");
  const netFields = Array.isArray(section.fields)
    ? section.fields.filter((field) => field?.label === "Net Investment Amount") : [];
  if (netFields.length !== 1 || !savedCurrency(netFields[0].value, "snapshot net investment").eq(net))
    fail("saved and displayed net investment disagree");
  const totalFields = section.fields.filter((field) => field?.label === "Total Allocation");
  if (totalFields.length !== 1 || totalFields[0].value !== "100%") fail("snapshot total allocation is not 100%");

  const used = new Set();
  return selected.map((fund) => {
    const matches = section.rows.filter((row) => row?.name === fund.name && row?.detail === fund.assetManagerName);
    if (matches.length !== 1 || used.has(matches[0])) fail("fund rows cannot be uniquely linked to saved fund IDs");
    const row = matches[0];
    used.add(row);
    const parts = typeof row.value === "string" ? row.value.split(" — ") : [];
    if (parts.length !== 2 || !parts[0].endsWith("%") || !percent(parts[0].slice(0, -1)).eq(allocations[fund.id]))
      fail("snapshot and saved allocation percentages disagree");
    return { fundId: fund.id, fundName: fund.name, assetManagerName: fund.assetManagerName,
      approvedPercent: allocations[fund.id].toFixed(), approvedAmount: savedCurrency(parts[1], "approved fund amount").toFixed(2) };
  });
}

/**
 * Normalises verified submitted amounts without recomputing allocations. The
 * resolvedFundIdentities argument must come from a trusted fund-ID lookup in a
 * future caller; this pure helper neither performs nor grants policy access.
 * Missing display amounts deliberately have no net * percentage fallback.
 */
function readApprovedActivationInput(policy, resolvedFundIdentities) {
  if (!object(policy) || !["APPROVED", "ACTIVE"].includes(policy.status) ||
      typeof policy.id !== "string" || !policy.id || !policy.clientId) fail("approved client policy is required");
  const form = policy.form;
  if (!object(form) || form.portfolioSkipped === "yes") fail("approved portfolio is missing or skipped");
  const net = amount(form.netInvestment, "net investment");
  const selected = json(form.selectedFunds, "selected funds");
  const savedAllocations = json(form.portfolioAllocations, "allocation percentages");
  if (!Array.isArray(selected) || !selected.length || !object(savedAllocations)) fail("saved portfolio is incomplete");

  const ids = new Set();
  const names = new Set();
  const allocations = Object.create(null);
  for (const fund of selected) {
    if (!object(fund) || typeof fund.id !== "string" || !fund.id.trim() ||
        typeof fund.name !== "string" || !fund.name.trim() ||
        typeof fund.assetManagerName !== "string" || !fund.assetManagerName.trim()) fail("fund identity is incomplete");
    const nameKey = JSON.stringify([fund.name, fund.assetManagerName]);
    if (ids.has(fund.id) || names.has(nameKey)) fail("duplicate or ambiguous fund identity");
    ids.add(fund.id); names.add(nameKey);
    if (!Object.hasOwn(savedAllocations, fund.id)) fail("fund allocation is missing");
    allocations[fund.id] = percent(savedAllocations[fund.id]);
  }
  if (Object.keys(savedAllocations).some((id) => !ids.has(id)) ||
      !Object.values(allocations).reduce((sum, value) => sum.plus(value), new Decimal(0)).eq(100)) fail("saved allocations must total exactly 100%");

  const sources = [
    ["reviewSnapshot", portfolio(form.reviewSnapshot, "review snapshot")],
    ["portfolioReviewSnapshot", portfolio(form.portfolioReviewSnapshot, "portfolio snapshot")],
  ].filter(([, section]) => section !== null);
  if (!sources.length) fail("exact submitted fund amounts are unavailable");
  const rows = sources.map(([, section]) => readRows(section, selected, allocations, net));
  if (rows.some((row) => JSON.stringify(row) !== JSON.stringify(rows[0]))) fail("submitted portfolio snapshots disagree");
  if (!rows[0].reduce((sum, row) => sum.plus(row.approvedAmount), new Decimal(0)).eq(net)) fail("approved amounts do not sum to saved net investment");

  if (!Array.isArray(resolvedFundIdentities)) fail("trusted fund identity lookup is required");
  const funds = rows[0].map((row) => {
    const matches = resolvedFundIdentities.filter((fund) => fund?.id === row.fundId);
    const identity = matches[0];
    if (matches.length !== 1 || typeof identity.assetManagerId !== "string" || !identity.assetManagerId.trim())
      fail("saved fund ID has no unique manager relationship");
    const saved = selected.find((fund) => fund.id === row.fundId);
    if (saved.assetManagerId && saved.assetManagerId !== identity.assetManagerId) fail("saved manager ID disagrees with fund ownership");
    return { ...row, assetManagerId: identity.assetManagerId };
  });
  const input = { policyId: policy.id, clientId: policy.clientId, currency: "BWP", approvedNetInvestment: net.toFixed(2), funds };
  return { ...input, provenance: { sources: sources.map(([label]) => label),
    inputHash: createHash("sha256").update(JSON.stringify(input)).digest("hex") } };
}

/** Excel's E17 / D17. This preview does not define issued-unit storage rounding. */
function previewInitialUnits(approvedAmount, recordedUnitPrice) {
  const money = amount(approvedAmount, "approved amount");
  const price = new Decimal(validatePrice(recordedUnitPrice));
  const units = money.div(price);
  const displayedUnits = units.toFixed(2);
  return {
    approvedAmount: money.toFixed(2), appliedPrice: price.toFixed(6),
    unitsPreview: units.toFixed(), displayedUnits,
    calculationNumerator: money.toFixed(2), calculationDenominator: price.toFixed(),
    roundedDisplayValueDifference: new Decimal(displayedUnits).times(price).minus(money).toFixed(8),
  };
}

module.exports = { previewInitialUnits, readApprovedActivationInput };