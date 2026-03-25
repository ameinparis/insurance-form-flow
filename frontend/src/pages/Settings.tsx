import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"
import { Eye, EyeOff, Sun, Moon, Monitor, Shield, Clock, User, FileText, LogIn, LogOut, Edit, Trash2, Plus, RefreshCw, Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuditLogs } from "@/hooks/useAuditLogs"

const Settings = () => {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const userName = localStorage.getItem("userName") || "User"
  const userEmail = localStorage.getItem("userEmail") || ""

  // Initialize email from localStorage
  const [email] = useState(() => localStorage.getItem("userEmail") || "")

  // Generate consistent pastel color based on user name (matches header avatar)
  const getAvatarStyles = (name: string) => {
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-200', ring: 'ring-blue-200' },
      { bg: 'bg-green-50', text: 'text-green-500', border: 'border-green-200', ring: 'ring-green-200' },
      { bg: 'bg-purple-50', text: 'text-purple-500', border: 'border-purple-200', ring: 'ring-purple-200' },
      { bg: 'bg-pink-50', text: 'text-pink-500', border: 'border-pink-200', ring: 'ring-pink-200' },
      { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-200', ring: 'ring-orange-200' },
      { bg: 'bg-teal-50', text: 'text-teal-500', border: 'border-teal-200', ring: 'ring-teal-200' },
      { bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-200', ring: 'ring-indigo-200' },
      { bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-200', ring: 'ring-rose-200' }
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarStyles = getAvatarStyles(userName)

  // Password change state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Audit trail filter state
  const [auditFilter, setAuditFilter] = useState("7days")
  const [auditPage, setAuditPage] = useState(1)
  const AUDIT_PAGE_SIZE = 50

  const formatActionLabel = (action: string) => {
    return action
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const handleExportAuditLogs = () => {
    if (!auditLogs || auditLogs.length === 0) return
    const headers = ['Date and Time', 'Actor', 'Action', 'Description']
    const rows = auditLogs.map(log => {
      const actorName = log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System'
      const date = new Date(log.createdAt)
      const formatted = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      return [formatted, actorName, formatActionLabel(log.action), log.details || ''].map(v => `"${v}"`)
    })
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure your new password and confirmation match.",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:5002/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to update password")
      }

    } catch {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const { logs: auditLogs, isLoading: auditLoading, error: auditError } = useAuditLogs(auditFilter)

  const getAuditIcon = (action: string) => {
    if (action.toLowerCase().includes('login') || action.toLowerCase().includes('sign')) return LogIn
    if (action.toLowerCase().includes('logout')) return LogOut
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) return Trash2
    if (action.toLowerCase().includes('create') || action.toLowerCase().includes('add')) return Plus
    if (action.toLowerCase().includes('update') || action.toLowerCase().includes('edit') || action.toLowerCase().includes('change')) return Edit
    return FileText
  }

  const formatAuditTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" }
    if (password.length < 6) return { strength: 25, label: "Weak", color: "bg-red-500" }
    if (password.length < 8) return { strength: 50, label: "Fair", color: "bg-orange-500" }
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 75, label: "Good", color: "bg-yellow-500" }
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { strength: 100, label: "Strong", color: "bg-green-500" }
    }
    return { strength: 50, label: "Fair", color: "bg-orange-500" }
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account & Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left side - Avatar and display info */}
                <div className="flex flex-col items-center md:border-r md:border-border md:pr-8">
                  <div className={`w-32 h-32 rounded-full ${avatarStyles.bg} flex items-center justify-center mb-4 ring-4 ${avatarStyles.ring} border-2 ${avatarStyles.border}`}>
                    <span className={`text-4xl font-bold ${avatarStyles.text}`}>{getInitials(userName)}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {userName.split(" ").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")}
                  </h3>
                </div>

                {/* Right side - Editable form */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Edit Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="Enter your first name" defaultValue="Ame" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Enter your last name" defaultValue="Busang" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      disabled 
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordData.newPassword && (
                  <div className="space-y-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength: <span className={passwordStrength.strength >= 75 ? "text-green-600" : "text-orange-500"}>{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>
                View your current session details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground"></p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p></p>
                  <p></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6 mt-6">
          <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-base">Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  {/* Light Theme Card */}
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all ${theme === 'light'
                        ? 'border-[#009fe3] bg-[#009fe3]/10'
                        : 'border-border bg-white dark:bg-slate-700/50 hover:border-muted-foreground/50'
                      }`}
                  >
                    <Sun className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-medium text-foreground">Light</span>
                  </button>

                  {/* Dark Theme Card */}
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all ${theme === 'dark'
                        ? 'border-[#009fe3] bg-[#009fe3]/10'
                        : 'border-border bg-white dark:bg-slate-700/50 hover:border-muted-foreground/50'
                      }`}
                  >
                    <Moon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-medium text-foreground">Dark</span>
                  </button>

                  {/* System Theme Card */}
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all ${theme === 'system'
                        ? 'border-[#009fe3] bg-[#009fe3]/10'
                        : 'border-border bg-white dark:bg-slate-700/50 hover:border-muted-foreground/50'
                      }`}
                  >
                    <Monitor className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-medium text-foreground">System</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6 mt-6">
          <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>
                  View system activity and user actions.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="filter" className="text-sm text-muted-foreground">Show:</Label>
                <select
                  id="filter"
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                  <p>Loading audit logs...</p>
                </div>
              ) : auditError ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Failed to load audit logs.</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity found for the selected period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#009fe3] text-white">
                        <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Date and Time</th>
                        <th className="text-left px-4 py-3 font-medium">Actor</th>
                        <th className="text-left px-4 py-3 font-medium">Action</th>
                        <th className="text-left px-4 py-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, index) => {
                        const actorName = log.userId
                          ? `${log.userId.firstName} ${log.userId.lastName}`
                          : 'System'
                        const date = new Date(log.createdAt)
                        const formattedDate = date.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                        const formattedTime = date.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                        return (
                          <tr
                            key={log._id}
                            className={`border-t border-border hover:bg-muted/50 transition-colors ${
                              index % 2 === 0 ? 'bg-white dark:bg-slate-700' : 'bg-gray-50 dark:bg-slate-800'
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                              {formattedDate} {formattedTime}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-medium">
                              {actorName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {log.action}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {log.details || '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default Settings

