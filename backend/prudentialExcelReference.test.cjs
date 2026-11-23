const { test } = require("node:test");
const assert = require("node:assert/strict");
const Decimal = require("decimal.js");
const { previewInitialUnits, readApprovedActivationInput } = require("./investmentPreview.cjs");

// Source: Annuity_Investemnts-_Oratile_1.xlsb, Dummy Data, inspected 2026-11-23.
// SHA256: eb2b462e3b6c4dbdfa9fc42c68885b440c8390af7271a433990f8a6a16c5deb2
const policy = () => {
  const portfolio = {
    title: "Investment Portfolio Setup", badge: "Total: 100%",
    fields: [{ label: "Net Investment Amount", value: "BWP 1,947,500.00" }, { label: "Total Allocation", value: "100%" }],
    rows: [{ name: "Money Market Fund", detail: "Saved Manager A", value: "30% — BWP 584,250.00" },
      { name: "Managed Prudential Fund", detail: "Saved Manager B", value: "70% — BWP 1,363,250.00" }],
  };
  const snapshot = JSON.stringify({ version: 1, sections: [portfolio] });
  return { id: "POL-reference", clientId: "client-reference", status: "APPROVED", form: {
    investmentAmount: "2000000", netInvestment: "1947500.00",
    portfolioAllocations: '{"money":"30","prudential":"70"}',
    selectedFunds: JSON.stringify([{ id: "money", name: "Money Market Fund", assetManagerName: "Saved Manager A" },
      { id: "prudential", name: "Managed Prudential Fund", assetManagerName: "Saved Manager B" }]),
    reviewSnapshot: snapshot, portfolioReviewSnapshot: snapshot,
  } };
};
const identities = [{ id: "money", assetManagerId: "manager-a" }, { id: "prudential", assetManagerId: "manager-b" }];
const editSnapshot = (record, callback, key = "reviewSnapshot") => {
  const snapshot = JSON.parse(record.form[key]); callback(snapshot.sections[0]); record.form[key] = JSON.stringify(snapshot);
};

test("Dummy Data C17 = E17/D17 retains 3.0798 and reproduces Excel's 442,642.38 units", () => {
  const preview = previewInitialUnits("1363250.00", "3.0798");
  assert.equal(preview.appliedPrice, "3.079800");
  assert.equal(preview.displayedUnits, "442642.38");
  assert.ok(preview.unitsPreview.startsWith("442642.379375284109357750503279433729462952139749"));
  assert.ok(new Decimal(preview.unitsPreview).minus("442642.3793752841").abs().lt("0.0000000001"));
});
test("Using displayed 3.08 instead of stored D17 does not reproduce Excel units", () => {
  const preview = previewInitialUnits("1363250.00", "3.08");
  assert.equal(preview.displayedUnits, "442613.64");
  assert.notEqual(preview.displayedUnits, "442642.38");
});
test("Unit display rounding neither changes the approved amount nor becomes issued units", () => {
  const preview = previewInitialUnits("1363250.00", "3.079800");
  assert.equal(preview.approvedAmount, "1363250.00");
  assert.equal(preview.roundedDisplayValueDifference, "0.00192400");
  assert.notEqual(preview.unitsPreview, preview.displayedUnits);
  assert.equal(preview.calculationNumerator, "1363250.00");
  assert.equal(preview.calculationDenominator, "3.0798");
});
test("Preview supports six-decimal prices and refuses invalid or rounded cash inputs", () => {
  assert.equal(previewInitialUnits("1.00", "0.000001").unitsPreview, "1000000");
  assert.equal(previewInitialUnits("12.34", "0.123400").displayedUnits, "100.00");
  for (const price of ["0", "-1", "3.0798001", "NaN", "1e-6", 3.0798]) assert.throws(() => previewInitialUnits("1.00", price));
  for (const amount of ["", "0", "-1", "1.001", "BWP 1.00", "1e6", 1363250]) assert.throws(() => previewInitialUnits(amount, "3.0798"));
});
test("Validated input preserves BWP 1,947,500 net and the submitted 70% / BWP 1,363,250 allocation", () => {
  const record = policy(); const before = JSON.stringify(record);
  const input = readApprovedActivationInput(record, identities);
  assert.equal(input.approvedNetInvestment, "1947500.00");
  assert.deepEqual(input.funds[1], { fundId: "prudential", assetManagerId: "manager-b", fundName: "Managed Prudential Fund",
    assetManagerName: "Saved Manager B", approvedPercent: "70", approvedAmount: "1363250.00" });
  assert.equal(previewInitialUnits(input.funds[1].approvedAmount, "3.0798").displayedUnits, "442642.38");
  assert.equal(JSON.stringify(record), before);
  assert.deepEqual(input.provenance.sources, ["reviewSnapshot", "portfolioReviewSnapshot"]);
});
test("No gross investment or current catalogue names are substituted into activation input", () => {
  const record = policy(); record.form.investmentAmount = "9999999999";
  const input = readApprovedActivationInput(record, identities.map((fund) => ({ ...fund, name: "Renamed Fund", assetManagerName: "Renamed Manager" })));
  assert.equal(input.funds[1].approvedAmount, "1363250.00");
  assert.equal(input.funds[1].assetManagerName, "Saved Manager B");
  delete record.form.netInvestment;
  assert.throws(() => readApprovedActivationInput(record, identities), /net investment/);
});
test("Missing submitted fund amounts block validation rather than net-times-percentage reconstruction", () => {
  const record = policy(); delete record.form.reviewSnapshot; delete record.form.portfolioReviewSnapshot;
  assert.throws(() => readApprovedActivationInput(record, identities), /exact submitted fund amounts/);
});
test("Contradictory snapshots block activation input without altering the approved record", () => {
  const record = policy(); editSnapshot(record, (section) => {
    section.rows[0].value = "30% — BWP 584,249.99"; section.rows[1].value = "70% — BWP 1,363,250.01";
  });
  const before = JSON.stringify(record);
  assert.throws(() => readApprovedActivationInput(record, identities), /snapshots disagree/);
  assert.equal(JSON.stringify(record), before);
});
test("Saved allocations must total 100% and cover exactly the selected fund IDs", () => {
  const record = policy(); record.form.portfolioAllocations = '{"money":"30","prudential":"69"}';
  assert.throws(() => readApprovedActivationInput(record, identities), /exactly 100%/);
  record.form.portfolioAllocations = '{"money":"30","prudential":"70","unselected":"1"}';
  assert.throws(() => readApprovedActivationInput(record, identities), /exactly 100%/);
});
test("Snapshot amounts and net must reconcile exactly, without adjusting rounding differences", () => {
  const record = policy();
  for (const key of ["reviewSnapshot", "portfolioReviewSnapshot"]) editSnapshot(record, (section) => { section.rows[1].value = "70% — BWP 1,363,250.01"; }, key);
  assert.throws(() => readApprovedActivationInput(record, identities), /do not sum/);
});
test("Snapshot net and percentages must agree with the saved machine-readable values", () => {
  const record = policy(); record.form.netInvestment = "1947500.01";
  assert.throws(() => readApprovedActivationInput(record, identities), /net investment disagree/);
  record.form.netInvestment = "1947500.00";
  editSnapshot(record, (section) => { section.rows[1].value = "69% — BWP 1,363,250.00"; });
  assert.throws(() => readApprovedActivationInput(record, identities), /percentages disagree/);
});
test("Unapproved, skipped, malformed and incomplete policy data are blocked", () => {
  for (const change of [
    (p) => { p.status = "DRAFT"; }, (p) => { p.clientId = ""; },
    (p) => { p.form.portfolioSkipped = "yes"; }, (p) => { p.form.selectedFunds = "bad json"; },
    (p) => { p.form.reviewSnapshot = '{"version":2,"sections":[]}'; },
    (p) => { editSnapshot(p, (section) => { section.rows = []; }); },
  ]) { const record = policy(); change(record); assert.throws(() => readApprovedActivationInput(record, identities), /requires review/); }
});
test("Missing manager relationships and duplicate saved names/IDs cannot be guessed", () => {
  assert.throws(() => readApprovedActivationInput(policy(), []), /manager relationship/);
  assert.throws(() => readApprovedActivationInput(policy()), /trusted fund/);
  const record = policy(); const selected = JSON.parse(record.form.selectedFunds);
  selected[1].name = selected[0].name; selected[1].assetManagerName = selected[0].assetManagerName;
  record.form.selectedFunds = JSON.stringify(selected);
  assert.throws(() => readApprovedActivationInput(record, identities), /ambiguous/);
});
test("Explicit saved manager IDs must match trusted fund ownership", () => {
  const record = policy(); const selected = JSON.parse(record.form.selectedFunds); selected[1].assetManagerId = "wrong-manager";
  record.form.selectedFunds = JSON.stringify(selected);
  assert.throws(() => readApprovedActivationInput(record, identities), /manager ID disagrees/);
});
test("Same-name funds under different managers remain independently ID-linked", () => {
  const record = policy(); const selected = JSON.parse(record.form.selectedFunds); selected[0].name = "Managed Prudential Fund";
  record.form.selectedFunds = JSON.stringify(selected);
  for (const key of ["reviewSnapshot", "portfolioReviewSnapshot"]) editSnapshot(record, (section) => { section.rows[0].name = "Managed Prudential Fund"; section.rows.reverse(); }, key);
  const input = readApprovedActivationInput(record, identities);
  assert.equal(input.funds[0].fundId, "money"); assert.equal(input.funds[0].approvedAmount, "584250.00");
  assert.equal(input.funds[1].fundId, "prudential"); assert.equal(input.funds[1].approvedAmount, "1363250.00");
});
test("Input provenance changes when verified submitted monetary inputs change", () => {
  const first = policy(); const second = policy();
  for (const key of ["reviewSnapshot", "portfolioReviewSnapshot"]) editSnapshot(second, (section) => {
    section.rows[0].value = "30% — BWP 584,249.99"; section.rows[1].value = "70% — BWP 1,363,250.01";
  }, key);
  assert.notEqual(readApprovedActivationInput(first, identities).provenance.inputHash,
    readApprovedActivationInput(second, identities).provenance.inputHash);
});