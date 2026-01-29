import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft, Mail, RefreshCw } from "lucide-react"

const LinkExpired = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Link Expired or Invalid</h1>
          <p className="text-muted-foreground">
            This link has expired or is no longer valid. For your security, links are only valid for a limited time.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <p className="text-sm text-muted-foreground font-medium">What you can do:</p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <RefreshCw className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Request a new password reset link</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Contact your administrator for a new setup link</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/auth/forgot-password">
            <Button className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Request New Link
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </div>

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

export default LinkExpired
