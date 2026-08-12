import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { AppRole, Permissions, permissionsFor, normalizeRole } from "./permissions"

interface AuthContextType {
  userId: string | null
  userRole: string | null
  userName: string | null
  userEmail: string | null
  role: AppRole
  permissions: Permissions
  token: string | null
  isLoggedIn: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Hydrate synchronously so role guards never render with a stale "advisor" default.
  const [userId, setUserId] = useState<string | null>(() => read("userId"))
  const [userRole, setUserRole] = useState<string | null>(() => read("userRole"))
  const [token, setToken] = useState<string | null>(() => read("token"))
  const [userName, setUserName] = useState<string | null>(() => read("userName"))
  const [userEmail, setUserEmail] = useState<string | null>(() => read("email"))

  useEffect(() => {
    const sync = () => {
      setToken(read("token"))
      setUserId(read("userId"))
      setUserRole(read("userRole"))
      setUserName(read("userName"))
      setUserEmail(read("email"))
    }
    sync()
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])


  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    setToken(null)
    setUserId(null)
    setUserRole(null)
  }

  const permissions = useMemo(() => permissionsFor(userRole), [userRole])

  return (
    <AuthContext.Provider
      value={{
        userId,
        userRole,
        userName,
        userEmail,
        role: normalizeRole(userRole),
        permissions,
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

export const usePermissions = () => useAuth().permissions
