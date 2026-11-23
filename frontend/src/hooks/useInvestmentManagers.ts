import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"
import { type AssetManager, type Fund, type Status } from "@/components/admin/assetManagerModel"

export const useInvestmentManagers = () => {
  const [managers, setManagers] = useState<AssetManager[]>([])
  const [loading, setLoading] = useState(false)

  const fetchManagers = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/asset-managers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error("Failed to fetch asset managers")
      const data = await response.json()
      setManagers(data.map((m: any) => ({
        id: m._id,
        name: m.name,
        description: m.description || "",
        status: m.status as Status,
        funds: [],
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })))
    } catch (e) {
      console.error("Failed to fetch asset managers:", e)
      setManagers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchManagers()
  }, [fetchManagers])

  const createManager = useCallback(async (data: {
    name: string
    description?: string
    status?: "Active" | "Inactive"
  }) => {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/asset-managers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || "Failed to create asset manager")
    }
    const newManager = await response.json()
    const mapped: AssetManager = {
      id: newManager._id,
      name: newManager.name,
      description: newManager.description || "",
      status: newManager.status as Status,
      funds: [],
      createdAt: newManager.createdAt,
      updatedAt: newManager.updatedAt,
    }
    setManagers(prev => [...prev, mapped])
    return mapped
  }, [])

  const updateManager = useCallback(async (id: string, data: {
    name?: string
    description?: string
    status?: "Active" | "Inactive"
  }) => {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/asset-managers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error("Failed to update asset manager")
    const updated = await response.json()
    const mapped: AssetManager = {
      id: updated._id,
      name: updated.name,
      description: updated.description || "",
      status: updated.status as Status,
      funds: [],
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }
    setManagers(prev => prev.map(m => m.id === id ? mapped : m))
    return mapped
  }, [])

  const removeManager = useCallback(async (id: string) => {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/asset-managers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Failed to delete asset manager")
    setManagers(prev => prev.filter(m => m.id !== id))
  }, [])

  const createFund = useCallback(async (managerId: string, data: {
    name: string
    type?: string
    code?: string
    risk?: string
    description?: string
    status?: "Active" | "Inactive"
    monthlyAdminFeePct?: string
  }) => {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/asset-managers/${managerId}/funds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || "Failed to create fund")
    }
    const newFund = await response.json()
    const mapped: Fund = {
      id: newFund._id,
      name: newFund.name,
      type: newFund.type,
      code: newFund.code || "",
      risk: newFund.risk,
      description: newFund.description || "",
      monthlyAdminFeePct: newFund.monthlyAdminFeePct || "",
      status: newFund.status as Status,
    }
    return mapped
  }, [])

  const updateFund = useCallback(async (managerId: string, fundId: string, data: {
    name?: string
    type?: string
    code?: string
    risk?: string
    description?: string
    status?: "Active" | "Inactive"
    monthlyAdminFeePct?: string
  }) => {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/asset-managers/${managerId}/funds/${fundId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || "Failed to update fund")
    }
    const updated = await response.json()
    const mapped: Fund = {
      id: updated._id,
      name: updated.name,
      type: updated.type,
      code: updated.code || "",
      risk: updated.risk,
      description: updated.description || "",
      monthlyAdminFeePct: updated.monthlyAdminFeePct || "",
      status: updated.status as Status,
    }
    return mapped
  }, [])

  const removeFund = useCallback(async (managerId: string, fundId: string) => {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/asset-managers/${managerId}/funds/${fundId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Failed to delete fund")
  }, [])

  const fetchFunds = useCallback(async (managerId: string): Promise<Fund[]> => {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/asset-managers/${managerId}/funds`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Failed to fetch funds")
    const data = await response.json()
    return data.map((f: any) => ({
      id: f._id,
      name: f.name,
      type: f.type,
      code: f.code || "",
      risk: f.risk,
      description: f.description || "",
      monthlyAdminFeePct: f.monthlyAdminFeePct || "",
      status: f.status as Status,
    }))
  }, [])

  const fetchAllFunds = useCallback(async (): Promise<Array<Fund & { assetManagerName: string; assetManagerId: string }>> => {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/asset-managers/funds`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Failed to fetch funds")
    const data = await response.json()
    return data.map((f: any) => ({
      id: f._id,
      name: f.name,
      type: f.type,
      code: f.code || "",
      risk: f.risk,
      description: f.description || "",
      monthlyAdminFeePct: f.monthlyAdminFeePct || "",
      status: f.status as Status,
      assetManagerName: f.assetManagerId?.name || "",
      assetManagerId: f.assetManagerId?._id || f.assetManagerId || "",
    }))
  }, [])

  return { managers, loading, createManager, updateManager, removeManager, createFund, updateFund, removeFund, fetchFunds, fetchAllFunds }
}

/** Flat list of every configured fund, used by the policy wizard. */
export const useFundOptions = () => {
  const { managers } = useInvestmentManagers()
  return managers.flatMap((m) => m.funds).filter(Boolean)
}
