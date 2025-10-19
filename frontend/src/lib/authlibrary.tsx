import React, { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  userId: string | null
  userRole: string | null
  token: string | null
  isLoggedIn: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUserId = localStorage.getItem("userId")
    const storedUserRole = localStorage.getItem("userRole")

    if (storedToken && storedUserId) {
      setToken(storedToken)
      setUserId(storedUserId)
      setUserRole(storedUserRole)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    setToken(null)
    setUserId(null)
    setUserRole(null)
  }

  return (
    <AuthContext.Provider
      value={{
        userId,
        userRole,
        token,
        isLoggedIn: !!token,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
