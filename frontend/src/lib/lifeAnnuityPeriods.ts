import axios from "axios";

export const LIFE_ANNUITY_PERIODS = [5, 10, 15, 20] as const;

export type LifePeriodResult = {
  guarantee_period: number;
  monthly_annuity: number | null;
};

/**
 * Fetch monthly life annuity values for all standard guarantee periods (5, 10, 15, 20).
 * If `known` contains a period we already have, it's used to avoid a redundant API call.
 */
export async function fetchLifeAnnuityPeriods(
  age: number,
  purchaseAmount: number,
  known?: { guarantee_period?: number | null; monthly_annuity?: number | null }
): Promise<LifePeriodResult[]> {
  if (!Number.isFinite(age) || !Number.isFinite(purchaseAmount) || age <= 0 || purchaseAmount <= 0) {
    return LIFE_ANNUITY_PERIODS.map((p) => ({ guarantee_period: p, monthly_annuity: null }));
  }

  const results = await Promise.all(
    LIFE_ANNUITY_PERIODS.map(async (period) => {
      if (
        known &&
        known.guarantee_period === period &&
        known.monthly_annuity != null &&
        Number.isFinite(known.monthly_annuity)
      ) {
        return { guarantee_period: period, monthly_annuity: known.monthly_annuity };
      }
      try {
        const { data } = await axios.post(
          "http://localhost:5002/api/quotes/calculate-annuity",
          {
            annuityType: "life",
            age,
            purchaseAmount,
            guaranteePeriod: period,
          }
        );
        const monthly = data?.output?.monthly_annuity;
        return {
          guarantee_period: period,
          monthly_annuity: typeof monthly === "number" ? monthly : null,
        };
      } catch {
        return { guarantee_period: period, monthly_annuity: null };
      }
    })
  );
  return results;
}
