import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col p-6 pl-0">
          <header className="h-16 bg-card rounded-2xl shadow-sm flex items-center px-6 justify-between mb-6 border border-border/30">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <SidebarTrigger className="lg:hidden" />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary-gradient-from))] to-[hsl(var(--primary-gradient-to))] text-white text-sm">
                  U
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <div className="flex-1 bg-transparent rounded-xl p-0">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}