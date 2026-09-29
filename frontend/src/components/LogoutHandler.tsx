import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"

const LogoutHandler = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    // Clears the app's auth/user state (token, userId, userRole, userName,
    // userEmail) plus this user's session data. No blanket storage clear.
    logout()
    toast.success("Successfully logged out")
    navigate("/", { replace: true })
  }, [logout, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Logging out...</p>
      </div>
    </div>
  )
}

export default LogoutHandler
