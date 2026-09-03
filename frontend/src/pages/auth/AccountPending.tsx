import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Mail, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/api"

const AccountPending = () => {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      // Always show success to prevent enumeration
      toast.success("If your account exists, a new setup link has been sent.")
      setShowResend(false)
    } catch (error) {
      toast.success("If your account exists, a new setup link has been sent.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Account Setup Required</h1>
          <p className="text-muted-foreground">
            Your account has been created but requires activation. Please check your email for the setup link to set your password.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="w-5 h-5" />
            <span className="text-sm">Check your inbox and spam folder</span>
          </div>
        </div>

        {!showResend ? (
          <Button
            variant="outline"
            onClick={() => setShowResend(true)}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Resend Setup Link
          </Button>
        ) : (
          <form onSubmit={handleResend} className="space-y-4 mt-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowResend(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Link"}
              </Button>
            </div>
          </form>
        )}

        <p className="text-sm text-muted-foreground">
          Need help?{" "}
          <a href="mailto:support@exclusivelife.co.bw" className="text-primary hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}

export default AccountPending
