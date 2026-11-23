/** Investment statement rows, built only from stored transaction records. No balances are recomputed here. */
export type StatementEntryType =
  | "INITIAL_PURCHASE" | "MARKET_PRICE_ADJUSTMENT" | "FUNERAL_COVER_PREMIUM" | "ADMINISTRATION_FEE"
  | "INVESTMENT_RETURN" | "SALARY_PAYMENT" | "MONTHLY_INTEREST" | "OTHER"

export const STATEMENT_DESCRIPTIONS: Record<StatementEntryType, string> = {
  INITIAL_PURCHASE: "Net Investment Amount", MARKET_PRICE_ADJUSTMENT: "Market Price Adjustment",
  FUNERAL_COVER_PREMIUM: "Funeral Cover Premium", ADMINISTRATION_FEE: "Administration Fee",
  INVESTMENT_RETURN: "Investment Return", SALARY_PAYMENT: "Salary Payment", MONTHLY_INTEREST: "Monthly Interest", OTHER: "Other",
}

/** All numeric fields are exact decimal strings as stored; signed where they represent movements. */
export interface StatementEntry {
  type: StatementEntryType; date: string; description: string
  units: string | null; unitPrice: string | null; marketValue: string; closingBalance: string
}

export interface StoredPurchase { fundId: string; purchaseDate: string; investmentAmount: string; unitPrice: string; units: string; closingBalance: string }

export interface StoredMarketAdjustment { fundId: string; valuationDate: string; newUnitPrice: string; adjustment: string; newClosingBalance: string; sequence?: number }

/** Rows from stored records only. Market Price Adjustment rows leave Number of Units blank (Excel convention). */
export function buildStatement(purchases: StoredPurchase[], fundId: string | undefined, adjustments: StoredMarketAdjustment[] = []): StatementEntry[] {
  if (!fundId) return []
  const rows: StatementEntry[] = [
    ...purchases.filter((p) => p.fundId === fundId).map((p) => ({ type: "INITIAL_PURCHASE" as const, date: p.purchaseDate, description: STATEMENT_DESCRIPTIONS.INITIAL_PURCHASE,
      units: p.units, unitPrice: p.unitPrice, marketValue: p.investmentAmount, closingBalance: p.closingBalance })),
    ...adjustments.filter((a) => a.fundId === fundId).map((a) => ({ type: "MARKET_PRICE_ADJUSTMENT" as const, date: a.valuationDate,
      description: STATEMENT_DESCRIPTIONS.MARKET_PRICE_ADJUSTMENT, units: null, unitPrice: a.newUnitPrice, marketValue: a.adjustment, closingBalance: a.newClosingBalance })),
  ]
  return rows.map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.date < b.e.date ? -1 : a.e.date > b.e.date ? 1 : a.i - b.i))
    .map(({ e }) => e)
}

/** Latest stored closing balance (last row), never recomputed. */
export const latestClosingBalance = (rows: StatementEntry[]) => (rows.length ? rows[rows.length - 1].closingBalance : null)

/** Half-up rounding on a decimal string, without floating point. */
export function roundDecimal(value: string, places: number): string {
  const neg = value.trim().startsWith("-")
  const [ip, fp = ""] = value.trim().replace(/^[-+]/, "").split(".")
  const digits = (ip.replace(/^0+(?=\d)/, "") || "0") + fp.padEnd(places + 1, "0").slice(0, places + 1)
  let n = BigInt(digits.slice(0, -1) || "0")
  if (Number(digits.slice(-1)) >= 5) n += 1n
  const s = n.toString().padStart(places + 1, "0")
  const out = places ? `${s.slice(0, -places)}.${s.slice(-places)}` : s
  return neg && n !== 0n ? `-${out}` : out
}

const group = (v: string) => { const [i, d] = v.split("."); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (d !== undefined ? `.${d}` : "") }
const signed = (v: string, places: number, prefix = "") => {
  const r = roundDecimal(v, places)
  return r.startsWith("-") ? `(${prefix}${group(r.slice(1))})` : `${prefix}${group(r)}`
}
export const formatMoney = (v: string) => signed(v, 2, "BWP ")
export const formatUnits = (v: string) => signed(v, 2)
export const formatPrice = (v: string) => `BWP ${group(roundDecimal(v, 6))}`
export const formatDate = (iso: string) => iso.slice(0, 10).split("-").reverse().join(".")
