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
    <Sidebar variant="inset" className="w-64 bg-card rounded-[40px] sticky top-0 h-[calc(100vh-7rem)] overflow-hidden border-0 shadow-sm">
      <SidebarContent className="flex flex-col h-full">
        {/* MENU Section */}
        <div className="px-4 pt-5 pb-3">
          <div className="mb-4">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Menu</span>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : "text-foreground/70 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-500" />
                    )}
                    <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                    <span className="text-[13px] font-semibold whitespace-nowrap">{item.title}</span>
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

          <nav className="space-y-2">
            {settingsItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : item.title === "Logout"
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-foreground/70 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-500" />
                    )}
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${item.title === "Logout" ? "text-red-500" : ""}`} strokeWidth={2} />
                    <span className={`text-[13px] font-semibold ${item.title === "Logout" ? "text-red-500" : ""}`}>{item.title}</span>
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

