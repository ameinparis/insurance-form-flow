import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Search, Bell, User } from "lucide-react"
import { Input } from "@/components/ui/input"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col p-6">
          <header className="h-14 bg-card rounded-xl shadow-sm flex items-center px-6 justify-between mb-6 border border-border/50">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="lg:hidden" />
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 bg-background/50 border-border/50 rounded-lg h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full"></span>
              </button>
              <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          </header>
          <div className="flex-1 bg-card rounded-xl shadow-sm p-6 border border-border/50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}