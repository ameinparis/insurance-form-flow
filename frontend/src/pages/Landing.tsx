import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, ArrowRight, Lock, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { authApi } from "@/lib/api"
import { toast } from "sonner"
// import corporateHandshake from "@/assets/corporate-handshake.jpg"

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
      await authApi.signIn(email, password)
      setIsLoading(false)
      setShowAuthDialog(false)
      toast.success("Welcome to Exclusive Insurance!")
      navigate("/dashboard")
    } catch (error) {
      setIsLoading(false)
      toast.error("Authentication failed. Please check your credentials.")
      console.error("Authentication error:", error)
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
            <Shield className="h-7 w-7 text-[hsl(var(--brand-accent))]" aria-hidden="true" />
            <span className="text-xl font-semibold">Exclusive Insurance</span>
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
            Insurance protection, simplified.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Smart coverage, clear pricing, and rapid quotes—built to protect what matters with confidence.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
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
          </div>
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
            <DialogTitle className="text-2xl font-bold text-center">Welcome Back</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 rounded-full font-semibold transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
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

export default Landing