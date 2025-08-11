import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, TrendingUp, Users, Award, ArrowRight, Lock, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { authApi } from "@/lib/api"
import { toast } from "sonner"

const Landing = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  // SEO: set basic meta and canonical
  useEffect(() => {
    const title = 'Exclusive Insurance — Simple, Smart Coverage'
    document.title = title

    const desc = 'Get a quick Living Annuity quotation and more, simply and securely.'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', desc)

    const href = window.location.origin + '/'
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', href)
  }, [])

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="relative z-10 border-b border-border">
        <nav className="flex items-center justify-between max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Exclusive Insurance</span>
          </div>
          <Button onClick={() => setShowAuthDialog(true)} className="rounded-full">
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Modern Insurance, made simple</h1>
          <p className="mt-4 text-lg text-muted-foreground">Get fast, accurate quotations for Living and Life Annuities.</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="rounded-full" onClick={() => navigate('/calculate')}>
              Calculator
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => setShowAuthDialog(true)}>
              Sign In
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 font-medium"><TrendingUp className="h-4 w-4 text-primary" /> Living Annuity</div>
              <p className="mt-1 text-sm text-muted-foreground">Transparent fees and flexible payouts.</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 font-medium"><Award className="h-4 w-4 text-primary" /> Life Annuity</div>
              <p className="mt-1 text-sm text-muted-foreground">Guaranteed income for life.</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 font-medium"><Users className="h-4 w-4 text-primary" /> Expert Support</div>
              <p className="mt-1 text-sm text-muted-foreground">We’re here to help you decide.</p>
            </div>
          </div>

          {/* Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Exclusive Insurance",
                url: typeof window !== 'undefined' ? window.location.origin : ''
              })
            }}
          />
        </section>
      </main>

      
        
      


      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md bg-background border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Welcome Back</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-muted border border-border text-foreground placeholder-muted-foreground"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-muted border border-border text-foreground placeholder-muted-foreground"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full rounded-full"
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
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border border-border rounded-2xl p-8 text-center text-foreground">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg">Connecting to your dashboard...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Landing