import { useCallback, useEffect, useState } from "react"

export type AnnuityScenarioInputs = {
  age: number
  purchaseAmount: number
  drawdown: number
  frequency: "Monthly" | "Annual"
  guaranteedStartAge: number
  lifePurchaseAmount?: number
  upfrontCommission?: number
  ongoingCommission?: number
  guaranteePeriod?: number
}

export type AnnuityScenarioOutputs = {
  living: {
    guarantee_period: number
    guaranteed_annuity: number
    funds_remaining: number
    retirement_annuity: number
  } | null
  life: {
    monthly_annuity: number
  } | null
}

export type AnnuityScenario = {
  id: string
  label: string
  inputs: AnnuityScenarioInputs
  outputs: AnnuityScenarioOutputs
  createdAt: string
}

const STORAGE_KEY = "annuity_scenarios_v1"

const buildAutoLabel = (inputs: AnnuityScenarioInputs, outputs: AnnuityScenarioOutputs) => {
  const dd = Number.isFinite(inputs.drawdown) ? `${inputs.drawdown}% Drawdown` : null
  const gp = outputs.living?.guarantee_period ?? inputs.guaranteePeriod
  const gpStr = Number.isFinite(gp as number) ? `${gp}-Year Guarantee` : null
  const freq = inputs.frequency ? inputs.frequency : null
  const parts = [dd, gpStr, freq].filter(Boolean) as string[]
  return parts.length ? parts.join(" · ") : "Scenario"
}

const ensureUniqueLabel = (base: string, existing: string[]) => {
  if (!existing.includes(base)) return base
  let i = 2
  while (existing.includes(`${base} (${i})`)) i++
  return `${base} (${i})`
}

export const useAnnuityScenarios = () => {
  const [scenarios, setScenarios] = useState<AnnuityScenario[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AnnuityScenario[]
        if (Array.isArray(parsed)) setScenarios(parsed)
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Persist
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
    } catch {
      /* ignore */
    }
  }, [scenarios])

  const addScenario = useCallback(
    (data: Omit<AnnuityScenario, "id" | "label" | "createdAt"> & { label?: string }) => {
      const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      setScenarios((prev) => {
        const base = data.label ?? buildAutoLabel(data.inputs, data.outputs)
        const label = ensureUniqueLabel(base, prev.map((s) => s.label))
        const next: AnnuityScenario = {
          id,
          label,
          inputs: data.inputs,
          outputs: data.outputs,
          createdAt: new Date().toISOString(),
        }
        return [...prev, next]
      })
      setSelectedIds((prev) => [...prev, id])
      return id
    },
    []
  )

  const removeScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id))
    setSelectedIds((prev) => prev.filter((sid) => sid !== id))
  }, [])

  const renameScenario = useCallback((id: string, label: string) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)))
  }, [])

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(scenarios.map((s) => s.id))
  }, [scenarios])

  const clearSelected = useCallback(() => setSelectedIds([]), [])

  const clearAll = useCallback(() => {
    setScenarios([])
    setSelectedIds([])
  }, [])

  return {
    scenarios,
    selectedIds,
    addScenario,
    removeScenario,
    renameScenario,
    toggleSelected,
    selectAll,
    clearSelected,
    clearAll,
  }
}
