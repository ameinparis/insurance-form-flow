import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Bell, User } from "lucide-react"

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
            <div className="flex items-center gap-3 flex-1">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-xl font-semibold text-foreground font-heading hidden sm:block">Overview</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="h-9 w-9 bg-gradient-to-br from-[hsl(var(--primary-gradient-from))] to-[hsl(var(--primary-gradient-to))] rounded-lg flex items-center justify-center shadow-md">
                <User className="h-4 w-4 text-white" />
              </div>
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