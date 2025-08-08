const API_BASE_URL = 'http://localhost:4001/api'

export interface Quote {
  id: string
  createdBy: string
  customerName: string
  productName: string
  frequency: string
  contact: string
  quoteCreated: string
}

export interface DashboardStats {
  totalQuotes: number
  totalCalculations: number
  successRate: number
  revenue: number
}

export interface ChartData {
  monthlyData: Array<{ month: string; quotes: number; calculations: number }>
  categoryData: Array<{ name: string; value: number; color: string }>
}

// Authentication
export const authApi = {
  signIn: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    
    if (!response.ok) {
      throw new Error('Authentication failed')
    }
    
    return response.json()
  }
}

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }
    
    return response.json()
  },
  
  getChartData: async (): Promise<ChartData> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/charts`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch chart data')
    }
    
    return response.json()
  }
}

// Quotes API
export const quotesApi = {
  getRecentQuotes: async (): Promise<Quote[]> => {
    const response = await fetch(`${API_BASE_URL}/quotes/recent`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch recent quotes')
    }
    
    return response.json()
  },
  
  getAllQuotes: async (): Promise<Quote[]> => {
    const response = await fetch(`${API_BASE_URL}/quotes`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch quotes')
    }
    
    return response.json()
  },
  
  deleteQuote: async (quoteId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/quotes/${quoteId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete quote')
    }
  }
}

// Calculator API
export const calculatorApi = {
  calculate: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/calculator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Calculation failed')
    }
    
    return response.json()
  }
}