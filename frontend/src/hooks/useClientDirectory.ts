import { useCallback, useEffect, useState } from "react"

export interface DirectoryClient {
  id: string
  fullName: string
  email?: string
  contactNumber?: string
  idNumber?: string
  dateOfBirth?: string
  productType: string
  optionLabel?: string
  quoteId?: string
  premium?: number
  createdAt: string
}

const STORAGE_KEY = "client_directory_v1"
const SEED_KEY = "client_directory_seeded_v1"
const EVENT = "client-directory-updated"

const SAMPLE_CLIENTS: DirectoryClient[] = [
  {
    id: "cl_sample_kabelo",
    fullName: "Kabelo Mokoena",
    email: "k.mokoena@example.bw",
    contactNumber: "+267 71 234 567",
    idNumber: "521418904",
    dateOfBirth: "1968-04-12",
    productType: "Living Annuity",
    optionLabel: "Option 1 — 5% Drawdown",
    quoteId: "QT-2026-000184",
    premium: 8400,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "cl_sample_naledi",
    fullName: "Naledi Setlhare",
    email: "n.setlhare@example.bw",
    contactNumber: "+267 72 998 210",
    idNumber: "336720115",
    dateOfBirth: "1974-11-03",
    productType: "Life Annuity",
    optionLabel: "Option 2 — Guaranteed 10 Years",
    quoteId: "QT-2026-000191",
    premium: 5120,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
]

const read = (): DirectoryClient[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    const list = Array.isArray(parsed) ? parsed : []
    if (list.length === 0 && !localStorage.getItem(SEED_KEY)) {
      localStorage.setItem(SEED_KEY, "1")
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_CLIENTS))
      return SAMPLE_CLIENTS
    }
    return list
  } catch {
    return []
  }
}


const write = (clients: DirectoryClient[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT))
}

export const useClientDirectory = () => {
  const [clients, setClients] = useState<DirectoryClient[]>(read)

  useEffect(() => {
    const sync = () => setClients(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const addClient = useCallback((client: Omit<DirectoryClient, "id" | "createdAt">) => {
    const current = read()
    const duplicate = current.find(
      (c) =>
        c.fullName.toLowerCase() === client.fullName.toLowerCase() &&
        c.optionLabel === client.optionLabel &&
        c.quoteId === client.quoteId
    )
    if (duplicate) return { created: false, client: duplicate }

    const next: DirectoryClient = {
      ...client,
      id: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    }
    write([next, ...current])
    return { created: true, client: next }
  }, [])

  const removeClient = useCallback((id: string) => {
    write(read().filter((c) => c.id !== id))
  }, [])

  return { clients, addClient, removeClient }
}
