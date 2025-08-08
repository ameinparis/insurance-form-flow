// calculator.js with Excel-matching Tx logic

// Lookup table extracted from annuity.xlsm for Tx survival rates
const txLookup = {
  55: 1.0, 55.08: 0.9977353374, 55.16: 0.9954758034, 55.24: 0.9932213865, 55.32: 0.9909720752,
  55.4: 0.9887278577, 55.48: 0.9864887227, 55.56: 0.9840365203, 55.64: 0.9815904135,
  55.72: 0.9791503873, 55.8: 0.9767164274, 55.88: 0.9742885194, 55.96: 0.9718666492,
  // ... full table should continue here, truncated for brevity
};

function getTxValue(age) {
  const keys = Object.keys(txLookup).map(Number);
  const exact = txLookup[age];
  if (exact !== undefined) return exact;

  // Interpolate between two closest keys
  let lower = keys[0];
  let upper = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] <= age && age < keys[i + 1]) {
      lower = keys[i];
      upper = keys[i + 1];
      break;
    }
  }
  const tLower = txLookup[lower];
  const tUpper = txLookup[upper];
  const ratio = (age - lower) / (upper - lower);
  return tLower + (tUpper - tLower) * ratio;
}

function calculateLivingAnnuity({ age, purchaseAmount, drawdown, guaranteedStartAge, frequency }) {
  const upfrontCommission = 0.02;
  const adminFee = 0.01;
  const assetManagementFee = 0.0075;
  const ongoingCommission = 0.01;
  const funeralPremium = 15;
  const vatRate = 0.14;

  const isMonthly = frequency === 'Monthly';
  const periodsPerYear = isMonthly ? 12 : 1;
  const totalPeriods = (guaranteedStartAge - age) * periodsPerYear;

  let balance = purchaseAmount * (1 - upfrontCommission);

  const drawdownRate = drawdown / 100;
  const periodicDrawdown = (balance * drawdownRate) / periodsPerYear;

  for (let period = 1; period <= totalPeriods; period++) {
    const yearIndex = Math.floor((period - 1) / periodsPerYear);
    const isFirstYear = yearIndex === 0;

    const baseFeeRate = adminFee + assetManagementFee + (isFirstYear ? 0 : ongoingCommission);
    const feeRate = baseFeeRate * (1 + vatRate);
    const netGrowth = 0.08 - feeRate;

    balance -= periodicDrawdown;
    balance *= Math.pow(1 + netGrowth, 1 / periodsPerYear);

    if (balance <= 0) {
      balance = 0;
      break;
    }
  }

  // Get survival probability (Tx) from table
  const tx = getTxValue(guaranteedStartAge);
  const guaranteedAnnuity = (tx * drawdownRate * purchaseAmount) / periodsPerYear;

  return {
    guarantee_period: guaranteedStartAge - age,
    guaranteed_annuity: Math.round(guaranteedAnnuity),
    funds_remaining: Math.round(balance)
  };
}

module.exports = { calculateLivingAnnuity };