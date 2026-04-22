import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, ArrowRight, Lock, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

const Landing = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("https://njs.exclusivelife.co.bw/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("userId", data.userId)
        if (data.role) localStorage.setItem("userRole", data.role)

        const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ")
        localStorage.setItem("userName", fullName)
        // Store the email used for login
        localStorage.setItem("userEmail", email)

        toast.success("Welcome to Exclusive Insurance!")
        navigate("/dashboard")
      }
      else {
        toast.error(data.message || "Invalid login credentials")
      }
    } catch (error) {
      toast.error("Network error or backend service is unreachable")
      console.error("Authentication error:", error)
    } finally {
      setIsLoading(false)
      setShowAuthDialog(false)
    }
  }


  useEffect(() => {
    const title = "Exclusive Insurance | Simple, Secure Insurance"
    const description = "Simple, secure insurance with smart protection and fast quotes."
    document.title = title

    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute("content", description)
    } else {
      const m = document.createElement("meta")
      m.setAttribute("name", "description")
      m.setAttribute("content", description)
      document.head.appendChild(m)
    }

    const canonicalHref = window.location.origin + "/"
    const existingLink = document.querySelector('link[rel="canonical"]')
    if (existingLink) {
      existingLink.setAttribute("href", canonicalHref)
    } else {
      const link = document.createElement("link")
      link.setAttribute("rel", "canonical")
      link.setAttribute("href", canonicalHref)
      document.head.appendChild(link)
    }
  }, [])


  useEffect(() => {
    document.documentElement.classList.remove("dark")
    return () => {
      if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark")
    }
  }, [])

  return (


    <div className="min-h-screen bg-white text-black dark:!bg-white dark:!text-black">
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <img
              src="/exclusive.png"
              alt="Exclusive Insurance Logo"
              className="h-16 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAuthDialog(true)}
              className="rounded-full bg-[#031d42] hover:bg-[#052851] text-white px-6  font-semibold transition-colors"

            >
              Sign in
            </Button>
          </div>
        </nav>
      </header>

      <section className="relative flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="font-montserrat  text-[clamp(2rem,5vw,5rem)] text-[#1b1b1b] leading-tight">
          Streamlining Insurance Quotations
        </h1>

        <p className="mt-6 text-sm sm:text-base md:text-lg text-gray-500 tracking-wide">
          Professional tool to calculate, manage, and deliver accurate quotes faster and smarter.  </p>

        {/* <div className="mt-16 w-full flex justify-center">
          <img
            src="/dash-image.jpg"
            alt="Dashboard preview"
            className="rounded-xl shadow-md w-[80%] max-w-5xl aspect-[3/1] object-cover border-4 border-[#ffffff]"
          />
        </div> */}

      </section>


      {/* subtle background motif */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(closest-side, hsl(var(--brand-accent)), transparent)' }} />
        <div className="absolute right-10 bottom-10 opacity-15">
          <Shield className="h-24 w-24 text-[hsl(var(--brand-accent))]" aria-hidden="true" />
        </div>
      </div>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md bg-white text-black border border-gray-200 dark:!bg-white dark:!text-black dark:!border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Sign In</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="rounded-full py-6 px-4 text-base"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="rounded-full py-6 px-4 text-base"
                />
              </div>
            </div>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-blue-500 hover:text-blue-600 text-sm"
                onClick={() => navigate("/auth/forgot-password")}
              >
                Forgot Password?
              </Button>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#031d42] hover:bg-[#052851] text-white py-6 rounded-full font-semibold text-base transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Login"
              )}
            </Button>


          </form>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Connecting to your dashboard...</p>
          </div>
        </div>
      )}
    </div>


  )
}

export default Landing;