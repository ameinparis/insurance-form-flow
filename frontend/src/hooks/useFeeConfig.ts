import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

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
  administrationFeePct: 0,
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

const authHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
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

  useEffect(() => {
    let active = true
    fetch(`${API_BASE_URL}/fee-config`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data || typeof data.administrationFeePct !== "string") return
        const value = Number(data.administrationFeePct)
        if (!Number.isFinite(value)) return
        setConfig((prev) => ({ ...prev, administrationFeePct: value }))
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  const saveConfig = useCallback((next: Partial<FeeConfig>) => {
    const merged = { ...read(), ...next }
    const nonAdmin = { ...merged }
    delete (nonAdmin as Partial<FeeConfig>).administrationFeePct
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...read(), ...nonAdmin }))
    } catch {
      /* ignore */
    }
    if (next.administrationFeePct !== undefined) {
      void fetch(`${API_BASE_URL}/fee-config`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ administrationFeePct: String(next.administrationFeePct) }),
      }).catch(() => undefined)
    }
    window.dispatchEvent(new Event(EVENT))
    setConfig(merged)
    return merged
  }, [])

  const resetConfig = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT))
    setConfig(DEFAULT_FEE_CONFIG)
  }, [])

  return { config, saveConfig, resetConfig }
}
