import { useState, useEffect, useMemo } from "react"

export interface ClientSuggestion {
  // Corporate/Scheme clients (Funeral, GLA)
  companyName?: string
  schemeName?: string
  registrationNumber?: string
  companyContact?: string
  companyEmail?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  // Individual clients (Annuity)
  fullName?: string
  idNumber?: string
  contactNumber?: string
  email?: string
  dateOfBirth?: string
  gender?: string
}

interface QuoteData {
  _id: string
  productType?: string
  client?: ClientSuggestion
}

const API_BASE_URL = "https://njs.exclusivelife.co.bw"

export const useClientSuggestions = () => {
  const [clients, setClients] = useState<ClientSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem("token")
        
        // Fetch from both legacy and new quotes
        const [legacyRes, newRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/quotes`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null),
          fetch(`${API_BASE_URL}/api/new-quotes`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null)
        ])

        const legacyData: QuoteData[] = legacyRes?.ok ? await legacyRes.json() : []
        const newData: QuoteData[] = newRes?.ok ? await newRes.json() : []

        // Extract unique clients from both sources
        const allClients: ClientSuggestion[] = []
        const seen = new Set<string>()

        const addClient = (client: ClientSuggestion | undefined) => {
          if (!client) return
          
          // Create a unique key based on identifying fields
          const key = (
            client.companyName || 
            client.schemeName || 
            client.fullName || 
            ""
          ).toLowerCase().trim()
          
          if (key && !seen.has(key)) {
            seen.add(key)
            allClients.push(client)
          }
        }

        // Process legacy quotes
        legacyData.forEach((quote) => {
          if (quote.client) {
            addClient(quote.client)
          }
        })

        // Process new quotes
        newData.forEach((quote) => {
          if (quote.client) {
            addClient(quote.client)
          }
        })

        setClients(allClients)
      } catch (err) {
        console.error("Failed to fetch client suggestions:", err)
        setError("Failed to load client suggestions")
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  const searchClients = useMemo(() => {
    return (query: string, type: "corporate" | "individual" = "corporate"): ClientSuggestion[] => {
      if (!query || query.length < 2) return []
      
      const lowerQuery = query.toLowerCase()
      
      return clients.filter((client) => {
        if (type === "corporate") {
          const name = client.companyName || client.schemeName || ""
          return name.toLowerCase().includes(lowerQuery)
        } else {
          const name = client.fullName || ""
          return name.toLowerCase().includes(lowerQuery)
        }
      }).slice(0, 7) // Limit to 7 suggestions
    }
  }, [clients])

  return { clients, loading, error, searchClients }
}
