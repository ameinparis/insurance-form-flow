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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="h-20 flex items-center px-6 justify-between border-b border-border bg-card">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <img src="/exclusive.png" alt="Logo" className="h-6 w-6 object-contain brightness-0 invert" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-foreground text-base font-heading leading-tight">EXCLUSIVE</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">INSURANCE</p>
              </div>
            </div>

            {/* Centered Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search" 
                  className="pl-11 h-11 bg-muted border-0 rounded-full focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Right Section: Settings + Avatar */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="h-10 w-10 rounded-full hover:bg-muted"
              >
                <Settings className="h-5 w-5 text-foreground" />
              </Button>
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  U
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <div className="flex-1 p-8 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}