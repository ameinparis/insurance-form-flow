import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/authlibrary"


interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const { userRole, isLoggedIn, logout } = useAuth()
  const userName = localStorage.getItem("userName") || "User"

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
      <div className="w-full bg-background px-6 pt-6">
        {/* Header */}
        <header className="sticky top-0 z-50 h-20 flex items-center px-6 justify-between border border-border bg-card rounded-2xl shadow-sm mb-6">
          <div className="flex items-center gap-2">
            <div className="h-[150px] w-[150px] rounded-xl bg-transparent flex items-center justify-center">
              <img
                src={isDarkMode ? "/logo-darkmode.png" : "/exclusive.png"}
                alt="Logo"
                className="h-[150px] w-[150px] object-contain transition-opacity duration-300"
              />
            </div>
          </div>

          {/* Center Search */}
          <div className="flex-1 max-w-3xl mx-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-12 h-12 bg-muted/70 border-0 rounded-full focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Avatar + User Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className={`${getAvatarColor(userName)} text-white text-sm font-medium`}>
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {userName.split(" ").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")}
              </span>
              <span className="text-xs text-muted-foreground">
                {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : ""}
              </span>
            </div>
          </div>
        </header>

        {/* Sidebar and Main Content */}
        <div className="flex gap-6">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>

      </div>
    </SidebarProvider>
  )
}
