import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/authlibrary"
import { useGlobalSearch } from "@/lib/searchContext"
import { useNavigate, useLocation } from "react-router-dom"


interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { globalSearchTerm, setGlobalSearchTerm } = useGlobalSearch()
  const navigate = useNavigate()
  const location = useLocation()

  const { userRole, isLoggedIn, logout } = useAuth()
  const userName = localStorage.getItem("userName") || "User"

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalSearchTerm(e.target.value)
    // Navigate to quotes page if not already there when searching
    if (e.target.value && location.pathname !== "/quotes") {
      navigate("/quotes")
    }
  }

  // Generate consistent color based on user name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-rose-500'
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

  // Monitor dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Set initial state
    setIsDarkMode(document.documentElement.classList.contains('dark'))

    return () => observer.disconnect()
  }, [])

  return (
    <SidebarProvider>
      <div className="w-full min-h-screen bg-muted/30">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 z-50 mx-8 mt-6 h-[72px] flex items-center px-8 justify-between bg-card rounded-[40px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border/40">
          {/* Logo */}
          <div className="flex items-center min-w-[200px]">
            <div className="h-[120px] w-[120px] flex items-center justify-center -ml-2">
              <img
                src={isDarkMode ? "/logo-darkmode.png" : "/exclusive.png"}
                alt="Exclusive Life Insurance"
                className="h-[120px] w-[120px] object-contain transition-opacity duration-300"
              />
            </div>
          </div>

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

          {/* Avatar + User Info */}
          <div className="flex items-center gap-3 min-w-[200px] justify-end">
            <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className={`${getAvatarColor(userName)} text-white text-sm font-medium`}>
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
        <div className="flex gap-6 px-8 pt-[130px] pb-6">
          <div className="sticky top-[102px] self-start">
            <AppSidebar />
          </div>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>

      </div>
    </SidebarProvider>
  )
}
