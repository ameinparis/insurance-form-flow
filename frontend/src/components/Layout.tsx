import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Search, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()

  return (
    <SidebarProvider>
      <div className="w-full bg-background px-6 pt-6">
        {/* Header */}
        <header className="sticky top-0 z-50 h-20 flex items-center px-6 justify-between border border-border bg-card rounded-2xl shadow-sm mb-6">
          <div className="flex items-center gap-2">
            <div className="h-[150px] w-[150px] rounded-xl bg-transparent flex items-center justify-center">
              <img src="/exclusive.png" alt="Logo" className="h-[150px] w-[150px] object-contain" />
            </div>


          </div>

          {/* Center Search */}
          <div className="flex-1 max-w-3xl mx-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-12 h-12 bg-muted border-0 rounded-full focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Avatar + Settings */}
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="h-10 w-10 rounded-full hover:bg-muted"
            >
              <Settings className="h-5 w-5 text-foreground" />
            </Button>
            <Avatar className="h-12 w-12">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                U
              </AvatarFallback>
            </Avatar>
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
