import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const LogoutHandler = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Clear authentication data
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    
    toast.success("Successfully logged out")
    navigate("/")
  }, [navigate])

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