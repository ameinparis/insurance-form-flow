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
      <div className="min-h-screen flex w-full bg-background p-4 gap-4">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 h-16 bg-card rounded-2xl shadow-sm flex items-center px-6 justify-between mb-4">
            <div className="flex items-center flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search here..." 
                  className="pl-10 bg-muted border-0 rounded-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          </header>
          <div className="flex-1 bg-card rounded-2xl shadow-sm p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}