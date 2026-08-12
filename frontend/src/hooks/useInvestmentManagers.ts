import { useCallback, useEffect, useState } from "react"

export interface InvestmentManager {
  id: string
  name: string
  funds: string[]
}

export const DEFAULT_MANAGERS: InvestmentManager[] = [
  {
    id: "im_default",
    name: "Default Asset Manager",
    funds: ["Money Market Fund", "Bond Fund", "Balanced Fund", "Equity Fund"],
  },
]

const STORAGE_KEY = "investment_managers_v1"
const EVENT = "investment-managers-updated"

const read = (): InvestmentManager[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_MANAGERS
  } catch {
    return DEFAULT_MANAGERS
  }
}

const write = (managers: InvestmentManager[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(managers))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT))
}

export const useInvestmentManagers = () => {
  const [managers, setManagers] = useState<InvestmentManager[]>(read)

  useEffect(() => {
    const sync = () => setManagers(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const addManager = useCallback((name: string, funds: string[] = []) => {
    const next: InvestmentManager = {
      id: `im_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      funds,
    }
    write([...read(), next])
    return next
  }, [])

  const updateManager = useCallback((id: string, patch: Partial<Omit<InvestmentManager, "id">>) => {
    write(read().map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const removeManager = useCallback((id: string) => {
    write(read().filter((m) => m.id !== id))
  }, [])

  return { managers, addManager, updateManager, removeManager }
}

/** Flat list of every configured fund, used by the policy wizard. */
export const useFundOptions = () => {
  const { managers } = useInvestmentManagers()
  return managers.flatMap((m) => m.funds).filter(Boolean)
}
