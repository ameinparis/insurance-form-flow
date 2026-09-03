import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/api"
import { useAuth } from "@/lib/authlibrary"

const SetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()
  const { login } = useAuth()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [userInfo, setUserInfo] = useState<{
    firstName: string
    lastName: string
    email: string
  } | null>(null)

  const [isVerifying, setIsVerifying] = useState(true)


  useEffect(() => {
    if (!token) {
      navigate("/auth/link-expired")
      return
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/password-setup/verify?token=${token}`
        )

        const data = await res.json()

        if (!res.ok) {
          navigate("/auth/link-expired")
          return
        }


        setUserInfo({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
        })
      } catch {
        navigate("/auth/link-expired")
      }
      finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        login({ token: data.token })
        toast.success("Welcome to Exclusive Life Quote Management 👋")
        navigate("/dashboard")
      }
      else {
        if (data.expired) {
          navigate("/auth/link-expired")
          return
        }

        toast.error(data.message || "Failed to set password")

      }
    } catch (error) {
      toast.error("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }



  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Verifying account…</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Account Activated!</h1>
          <p className="text-muted-foreground">
            Your password has been set successfully. Redirecting to sign in...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set Your Password</h1>
          <p className="text-muted-foreground">
            Create a secure password to activate your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {userInfo && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={userInfo.firstName} disabled className="pr-10" />
                </div>

                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={userInfo.lastName} disabled className="pr-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={userInfo.email} disabled className="pr-10" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Setting Password..." : "Activate Account"}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default SetPassword
