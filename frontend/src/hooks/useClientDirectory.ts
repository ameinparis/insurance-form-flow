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
const EVENT = "client-directory-updated"

const read = (): DirectoryClient[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
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
