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
      const response = await fetch("http://localhost:5002/api/users/login", {
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
    const title = "Exclusive Insurance — Simple, Secure Insurance"
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
  return (
    <div>
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
              className="rounded-full px-5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Button>
          </div>
        </nav>
      </header>


      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24">
        <section className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Exclusive Life Insurance<br />Quote Management
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Smart coverage, clear pricing, and rapid quotes—built to protect what matters with confidence.
          </p>

          {/* <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="rounded-full px-7 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate('/quote/personal-details')}
            >
              Get a Quote
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-7 border-border hover:bg-accent hover:text-accent-foreground"
              onClick={() => navigate('/calculator')}
            >
              Explore Calculator
            </Button>
          </div> */}
        </section>
      </main>

      {/* subtle background motif */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(closest-side, hsl(var(--brand-accent)), transparent)' }} />
        <div className="absolute right-10 bottom-10 opacity-15">
          <Shield className="h-24 w-24 text-[hsl(var(--brand-accent))]" aria-hidden="true" />
        </div>
      </div>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
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
              >
                Forgot Password?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-full font-semibold text-base transition-all duration-300"
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

            <div className="text-center">
              <div className="text-muted-foreground mb-4">OR</div>
              <div className="text-muted-foreground">
                Don't have an account?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="text-blue-500 hover:text-blue-600 p-0 h-auto font-normal"
                >
                  Signup
                </Button>
              </div>
            </div>
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