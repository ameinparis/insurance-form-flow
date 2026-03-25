import { useState, useEffect, useCallback } from 'react'

export interface AuditLog {
  _id: string
  action: string
  details?: string
  metadata?: Record<string, any>
  userId?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

interface AuditLogsResponse {
  logs: AuditLog[]
  total: number
  limit: number
  skip: number
}

const API_BASE_URL = 'https://njs.exclusivelife.co.bw/api'

export function useAuditLogs(filter: string) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ limit: '100', skip: '0' })

      // Calculate date range based on filter
      if (filter !== 'all') {
        const now = new Date()
        const startDate = new Date()
        if (filter === '7days') startDate.setDate(now.getDate() - 7)
        else if (filter === '30days') startDate.setDate(now.getDate() - 30)
        params.set('startDate', startDate.toISOString())
        params.set('endDate', now.toISOString())
      }

      const response = await fetch(`${API_BASE_URL}/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch audit logs')

      const data: AuditLogsResponse = await response.json()
      setLogs(data.logs)
      setTotal(data.total)
    } catch (e: any) {
      setError(e.message || 'Failed to fetch audit logs')
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { logs, total, isLoading, error, refetch: fetchLogs }
}
