import React, { createContext, useContext, useEffect, useMemo, useCallback, useState } from "react"
import { AppRole, Permissions, permissionsFor, normalizeRole } from "./permissions"

interface OrganisationInfo {
  _id: string
  name: string
  code: string
  isRootOrganisation: boolean
  allowedCalculators: string[]
  isActive: boolean
}

interface AuthContextType {
  userId: string | null
  userRole: string | null
  userName: string | null
  userEmail: string | null
  role: AppRole
  permissions: Permissions
  organisation: OrganisationInfo | null
  organisationLoading: boolean
  token: string | null
  isLoggedIn: boolean
  login: (params: {
    token: string
    userId?: string | null
    role?: string | null
    userName?: string | null
    userEmail?: string | null
  }) => void
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
  const [userEmail, setUserEmail] = useState<string | null>(() => read("userEmail"))
  const [organisation, setOrganisation] = useState<OrganisationInfo | null>(null)
  const [organisationLoading, setOrganisationLoading] = useState<boolean>(false)

  useEffect(() => {
    const sync = () => {
      setToken(read("token"))
      setUserId(read("userId"))
      setUserRole(read("userRole"))
      setUserName(read("userName"))
      setUserEmail(read("userEmail"))
    }
    sync()
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  const fetchOrganisation = useCallback(async (token: string | null) => {
    if (!token) {
      setOrganisation(null)
      setOrganisationLoading(false)
      return
    }

    setOrganisationLoading(true)
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5002"

    try {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        setOrganisation(null)
        setOrganisationLoading(false)
        return
      }

      const data = await res.json()
      if (data.organisation && typeof data.organisation === "object") {
        setOrganisation({
          _id: data.organisation._id,
          name: data.organisation.name,
          code: data.organisation.code,
          isRootOrganisation: data.organisation.isRootOrganisation,
          allowedCalculators: data.organisation.allowedCalculators || [],
          isActive: data.organisation.isActive !== false,
        })
      } else {
        setOrganisation(null)
      }
    } catch (err) {
      console.error("Failed to fetch organisation:", err)
      setOrganisation(null)
    } finally {
      setOrganisationLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganisation(token)
  }, [token])

  const login = useCallback(({ token: newToken, userId: newUserId, role, userName: newUserName, userEmail: newUserEmail }: {
    token: string
    userId?: string | null
    role?: string | null
    userName?: string | null
    userEmail?: string | null
  }) => {
    localStorage.setItem("token", newToken)
    if (newUserId) {
      localStorage.setItem("userId", newUserId)
    } else {
      localStorage.removeItem("userId")
    }
    if (role) {
      localStorage.setItem("userRole", role)
    } else {
      localStorage.removeItem("userRole")
    }
    if (newUserName) {
      localStorage.setItem("userName", newUserName)
    } else {
      localStorage.removeItem("userName")
    }
    if (newUserEmail) {
      localStorage.setItem("userEmail", newUserEmail)
    } else {
      localStorage.removeItem("userEmail")
    }
    setToken(newToken)
    setUserId(newUserId || null)
    setUserRole(role || null)
    setUserName(newUserName || null)
    setUserEmail(newUserEmail || null)
    fetchOrganisation(newToken)
  }, [fetchOrganisation])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")
    setToken(null)
    setUserId(null)
    setUserRole(null)
    setUserName(null)
    setUserEmail(null)
    setOrganisation(null)
  }, [])

  // User management is restricted to Super Admins and admins of the Root Organisation.
  // While the organisation is still loading, deny access to avoid a permissive first paint.
  const permissions = useMemo(() => {
    const base = permissionsFor(userRole)
    const appRole = normalizeRole(userRole)

    if (appRole === "super_admin") {
      return { ...base, canManageUsers: true }
    }

    const isRootAdmin = appRole === "admin" && organisation?.isRootOrganisation === true
    const resolved = organisationLoading && !isRootAdmin ? false : isRootAdmin

    return { ...base, canManageUsers: resolved }
  }, [userRole, organisation, organisationLoading])

  return (
    <AuthContext.Provider
       value={{
        userId,
        userRole,
        userName,
        userEmail,
        role: normalizeRole(userRole),
        permissions,
        organisation,
        organisationLoading,
        token,
        isLoggedIn: !!token,
        login,
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
