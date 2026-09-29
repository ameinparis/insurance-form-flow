import React, { createContext, useContext, useEffect, useMemo, useCallback, useRef, useState } from "react"
import { AppRole, Permissions, permissionsFor, normalizeRole } from "./permissions"
import { ANNUITY_SCENARIOS_STORAGE_KEY } from "@/hooks/useAnnuityScenarios"

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
  /** Re-fetch the profile (role + organisation + calculators) for the current user. */
  refreshProfile: () => Promise<void>
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

/** The only application auth/user keys this app owns. Never a blanket clear(). */
const AUTH_STORAGE_KEYS = ["token", "userId", "userRole", "userName", "userEmail"] as const

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeAuthKey = (key: (typeof AUTH_STORAGE_KEYS)[number], value?: string | null) => {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}

/** Remove every auth/user key this app owns, leaving all other storage intact. */
const clearAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* storage unavailable */
    }
  })
}

/** Draft annuity scenarios belong to the signed-in user; drop them on logout. */
const clearUserSessionData = () => {
  try {
    sessionStorage.removeItem(ANNUITY_SCENARIOS_STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Hydrate synchronously so role guards never render with a stale default.
  const [userId, setUserId] = useState<string | null>(() => read("userId"))
  const [userRole, setUserRole] = useState<string | null>(() => read("userRole"))
  const [token, setToken] = useState<string | null>(() => read("token"))
  const [userName, setUserName] = useState<string | null>(() => read("userName"))
  const [userEmail, setUserEmail] = useState<string | null>(() => read("userEmail"))
  const [organisation, setOrganisation] = useState<OrganisationInfo | null>(null)
  // A restored session counts as "loading" until its profile resolves, otherwise
  // role/organisation guards would decide on the first paint with no data yet.
  const [organisationLoading, setOrganisationLoading] = useState<boolean>(() => !!read("token"))

  // Guards against out-of-order /api/users/me responses when switching users fast.
  const profileRequest = useRef(0)
  // Prevents duplicate /api/users/me calls (e.g. focus + visibilitychange firing together).
  const profileInFlight = useRef(false)

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

  /**
   * Resolve the authoritative profile for the active token and apply it to the
   * session. Called on every token change, on window focus, and on demand, so
   * organisation/calculator changes made by an admin are picked up without a
   * logout/login.
   *
   * `showLoading` is only used when the session is being replaced: a background
   * revalidation keeps the current organisation on screen to avoid flashing an
   * empty calculator list.
   */
  const loadProfile = useCallback(async (activeToken: string, showLoading = false) => {
    if (profileInFlight.current) return
    profileInFlight.current = true

    const requestId = ++profileRequest.current
    if (showLoading) {
      setOrganisationLoading(true)
      setOrganisation(null)
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://exclusivelife-staging-138e70a865bc.herokuapp.com"

    try {
      const res = await fetch(`${baseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })

      if (requestId !== profileRequest.current) return
      if (!res.ok) {
        // Only an auth failure invalidates the cached organisation; a transient
        // server error must not wipe the member's calculator access.
        if (res.status === 401 || res.status === 403) setOrganisation(null)
        return
      }

      const data = await res.json()
      if (requestId !== profileRequest.current) return

      const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim()

      if (data._id) {
        writeAuthKey("userId", data._id)
        setUserId(data._id)
      }
      if (data.role) {
        writeAuthKey("userRole", data.role)
        setUserRole(data.role)
      }
      if (fullName) {
        writeAuthKey("userName", fullName)
        setUserName(fullName)
      }
      if (data.email) {
        writeAuthKey("userEmail", data.email)
        setUserEmail(data.email)
      }

      if (data.organisation && typeof data.organisation === "object") {
        setOrganisation({
          _id: data.organisation._id,
          name: data.organisation.name,
          code: data.organisation.code,
          isRootOrganisation: data.organisation.isRootOrganisation,
          allowedCalculators: Array.isArray(data.organisation.allowedCalculators)
            ? data.organisation.allowedCalculators
            : [],
          isActive: data.organisation.isActive !== false,
        })
      } else {
        setOrganisation(null)
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err)
    } finally {
      profileInFlight.current = false
      if (requestId === profileRequest.current) setOrganisationLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      profileRequest.current += 1
      setOrganisation(null)
      setOrganisationLoading(false)
      return
    }
    loadProfile(token, true)
  }, [token, loadProfile])

  // Revalidate on window focus / tab return so calculator assignment changes
  // made by an admin are applied without a full logout/login.
  useEffect(() => {
    if (!token) return

    const revalidate = () => {
      if (document.visibilityState === "hidden") return
      loadProfile(token)
    }

    window.addEventListener("focus", revalidate)
    document.addEventListener("visibilitychange", revalidate)
    return () => {
      window.removeEventListener("focus", revalidate)
      document.removeEventListener("visibilitychange", revalidate)
    }
  }, [token, loadProfile])

  const refreshProfile = useCallback(async () => {
    if (!token) return
    await loadProfile(token)
  }, [token, loadProfile])

  const login = useCallback(({ token: newToken, userId: newUserId, role, userName: newUserName, userEmail: newUserEmail }: {
    token: string
    userId?: string | null
    role?: string | null
    userName?: string | null
    userEmail?: string | null
  }) => {
    // A login fully replaces the previous session: no auth key survives, and the
    // previous user's organisation is dropped until the new profile is resolved.
    profileRequest.current += 1
    clearAuthStorage()

    writeAuthKey("token", newToken)
    writeAuthKey("userId", newUserId)
    writeAuthKey("userRole", role)
    writeAuthKey("userName", newUserName)
    writeAuthKey("userEmail", newUserEmail)

    setToken(newToken)
    setUserId(newUserId || null)
    setUserRole(role || null)
    setUserName(newUserName || null)
    setUserEmail(newUserEmail || null)
    setOrganisation(null)
  }, [])

  const logout = useCallback(() => {
    profileRequest.current += 1
    clearAuthStorage()
    clearUserSessionData()

    setToken(null)
    setUserId(null)
    setUserRole(null)
    setUserName(null)
    setUserEmail(null)
    setOrganisation(null)
    setOrganisationLoading(false)
  }, [])

  // User management is restricted to Super Admins and admins of the Root Organisation.
  // While the organisation is still loading, deny access to avoid a permissive first paint.
  const permissions = useMemo(() => {
    const base = permissionsFor(userRole)
    const appRole = normalizeRole(userRole)

    if (appRole === "none") {
      return { ...base, canManageUsers: false }
    }

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
        refreshProfile,
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
