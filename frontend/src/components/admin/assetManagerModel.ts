export const FUND_TYPES = ["Money Market", "Prudential", "Balanced", "Equity", "Fixed Income / Bond", "Other"] as const
export const RISK_LEVELS = ["Low", "Low–Moderate", "Moderate", "Moderate–High", "High"] as const
export type FundType = typeof FUND_TYPES[number]
export type RiskLevel = typeof RISK_LEVELS[number]
export type Status = "Active" | "Inactive"

export interface Fund {
  id: string
  name: string
  type: FundType
  code: string
  risk: RiskLevel
  description: string
  status: Status
}

export interface AssetManager {
  id: string
  name: string
  description: string
  status: Status
  funds: Fund[]
}

export const saveFund = (managers: AssetManager[], managerId: string, fund: Fund): AssetManager[] =>
  managers.map((manager) => manager.id !== managerId ? manager : {
    ...manager,
    funds: manager.funds.some((item) => item.id === fund.id)
      ? manager.funds.map((item) => item.id === fund.id ? fund : item)
      : [...manager.funds, fund],
  })