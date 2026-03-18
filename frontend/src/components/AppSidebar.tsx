import { Calculator, Home, FileText, Settings, LogOut, Users } from "lucide-react"
import { NavLink } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Calculator", url: "/calculator", icon: Calculator },
  { title: "Quotation Management", url: "/quotes", icon: FileText },
  { title: "Team", url: "/team", icon: Users },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logout", url: "/logout", icon: LogOut },
]

export function AppSidebar() {
  return (
    <Sidebar className="w-64 bg-background rounded-3xl sticky top-0 h-[calc(100vh-7rem)] overflow-hidden border-0">
      <SidebarContent className="flex flex-col h-full">
        {/* MENU Section */}
        <div className="px-4 pt-5 pb-3">
          <div className="mb-4">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Menu</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-sidebar-active text-sidebar-active-foreground"
                      : "text-foreground/70 dark:text-white hover:bg-sidebar-accent-hover"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? "bg-white/20" 
                        : "bg-muted/50 dark:bg-sidebar-accent"
                    }`}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    </div>
                    <span className="text-sm font-medium">{item.title}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="px-4 py-2">
          <div className="h-px bg-border/30" />
        </div>

        {/* SETTINGS Section */}
        <div className="px-4 pb-5 mt-auto">
          <div className="mb-4">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Settings</span>
          </div>

          <nav className="space-y-1">
            {settingsItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-sidebar-active text-sidebar-active-foreground"
                      : item.title === "Logout" 
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-foreground/70 dark:text-white hover:bg-sidebar-accent-hover"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? "bg-white/20" 
                        : item.title === "Logout"
                          ? "bg-red-50 dark:bg-red-900/20"
                          : "bg-muted/50 dark:bg-sidebar-accent"
                    }`}>
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${item.title === "Logout" ? "text-red-500" : ""}`} />
                    </div>
                    <span className={`text-sm font-medium ${item.title === "Logout" ? "text-red-500" : ""}`}>{item.title}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
