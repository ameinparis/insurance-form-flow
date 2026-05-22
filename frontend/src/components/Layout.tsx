import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Search, Sun, Moon } from "lucide-react"
import lightModeLogo from "@/assets/lightmodelogo.png"
import darkModeLogo from "@/assets/darkmodelogo.png"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/authlibrary"
import { useGlobalSearch } from "@/lib/searchContext"
import { useNavigate, useLocation } from "react-router-dom"
import { useTheme } from "@/hooks/useTheme"


interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { globalSearchTerm, setGlobalSearchTerm } = useGlobalSearch()
  const navigate = useNavigate()
  const location = useLocation()

  const { userRole } = useAuth()
  const userName = localStorage.getItem("userName") || "User"

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalSearchTerm(e.target.value)
    // Navigate to quotes page if not already there when searching
    if (e.target.value && location.pathname !== "/quotes") {
      navigate("/quotes")
    }
  }

  // Generate consistent pastel color based on user name
  const getAvatarStyles = (name: string) => {
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-200' },
      { bg: 'bg-green-50', text: 'text-green-500', border: 'border-green-200' },
      { bg: 'bg-purple-50', text: 'text-purple-500', border: 'border-purple-200' },
      { bg: 'bg-pink-50', text: 'text-pink-500', border: 'border-pink-200' },
      { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-200' },
      { bg: 'bg-teal-50', text: 'text-teal-500', border: 'border-teal-200' },
      { bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-200' },
      { bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-200' }
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

  return (
    <SidebarProvider>
      <div className="w-full h-screen overflow-hidden bg-background">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 z-50 mx-8 mt-6 h-[96px] flex items-center px-8 justify-between bg-card rounded-[40px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-0">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center min-w-[200px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-xl"
            aria-label="Go to dashboard"
          >
            <img
              src={isDarkMode ? darkModeLogo : lightModeLogo}
              alt="Exclusive Life Insurance"
              className="h-14 w-auto object-contain"
            />
          </button>

          {/* Center Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60" />
              <Input
                placeholder="Search by client, type, quote ID, creator..."
                value={globalSearchTerm}
                onChange={handleSearchChange}
                className="pl-11 h-11 bg-muted/50 border-0 rounded-full focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-muted/70 transition-colors text-sm placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Dark Mode Toggle + Avatar + User Info */}
          <div className="flex items-center gap-4 min-w-[280px] justify-end">
            {/* Dark/Light Toggle */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className="data-[state=checked]:bg-primary scale-90"
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Separator Line */}
            <div className="h-8 w-px bg-border/60" />

            {/* Avatar */}
            <Avatar className={`h-11 w-11 border-2 ${getAvatarStyles(userName).border}`}>
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className={`${getAvatarStyles(userName).bg} ${getAvatarStyles(userName).text} text-sm font-semibold`}>
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground leading-tight">
                {userName.split(" ").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : ""}
              </span>
            </div>
          </div>
        </header>

        {/* Sidebar and Main Content - aligned below header */}
        <div className="flex gap-6 px-8 pt-[130px] pb-6 h-[calc(100vh)]">
          <div className="flex-shrink-0 h-[calc(100vh-130px)]">
            <AppSidebar />
          </div>
          <main className="flex-1 overflow-auto bg-card rounded-3xl p-6 shadow-sm">
            {children}
          </main>
        </div>

      </div>
    </SidebarProvider>
  )
}
