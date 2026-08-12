import { useCallback, useEffect, useState } from "react"

export interface FeeConfig {
  purchasePremiumPct: number
  upfrontCommissionPct: number
  administrationFeePct: number
  ongoingAdvisoryMaxPct: number
  switchFee: number
  funeralPremium: number
}

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  purchasePremiumPct: 2,
  upfrontCommissionPct: 1,
  administrationFeePct: 0.083,
  ongoingAdvisoryMaxPct: 1,
  switchFee: 180,
  funeralPremium: 20,
}

const STORAGE_KEY = "fee_config_v1"
const EVENT = "fee-config-updated"

const read = (): FeeConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === "object" ? { ...DEFAULT_FEE_CONFIG, ...parsed } : DEFAULT_FEE_CONFIG
  } catch {
    return DEFAULT_FEE_CONFIG
  }
}

export const useFeeConfig = () => {
  const [config, setConfig] = useState<FeeConfig>(read)

  useEffect(() => {
    const sync = () => setConfig(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const saveConfig = useCallback((next: Partial<FeeConfig>) => {
    const merged = { ...read(), ...next }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT))
    return merged
  }, [])

  const resetConfig = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { config, saveConfig, resetConfig }
}
