import { Calculator, Home, FileText, Settings, LogOut, Moon, Sun, Users } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
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
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <Sidebar className="w-64 bg-white dark:bg-sidebar-background rounded-[32px] shadow-md sticky top-0 h-[calc(100vh-7rem)] overflow-hidden">
      <SidebarContent className="flex flex-col h-full">
        {/* MENU Section */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-6">
            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">Menu</span>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3 py-3 rounded-full transition-all duration-200 group ${
                    isActive
                      ? "bg-sidebar-active text-white"
                      : "text-foreground/70 dark:text-white hover:bg-muted/60 dark:hover:bg-sidebar-accent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                      isActive 
                        ? "bg-white/20" 
                        : "bg-muted/50 dark:bg-sidebar-accent"
                    }`}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                    </div>
                    <span className="text-sm font-medium">{item.title}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="px-6 py-3">
          <div className="h-px bg-border/30" />
        </div>

        {/* SETTINGS Section */}
        <div className="px-6 pb-6 mt-auto">
          <div className="mb-6">
            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">Settings</span>
          </div>

          {/* Light Mode Toggle */}
          <div className="flex items-center justify-between px-3 py-3 mb-2 rounded-full hover:bg-muted/60 dark:hover:bg-sidebar-accent transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 dark:bg-sidebar-accent">
                {isDarkMode ? <Moon className="h-5 w-5 text-foreground/70 dark:text-white" /> : <Sun className="h-5 w-5 text-foreground/70 dark:text-white" />}
              </div>
              <span className="text-sm font-medium text-foreground/70 dark:text-white">
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
              className="data-[state=checked]:bg-sidebar-active"
            />
          </div>

          <nav className="space-y-2">
            {settingsItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3 py-3 rounded-full transition-all duration-200 group ${
                    isActive
                      ? "bg-sidebar-active text-white"
                      : "text-foreground/70 dark:text-white hover:bg-muted/60 dark:hover:bg-sidebar-accent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                      isActive 
                        ? "bg-white/20" 
                        : "bg-muted/50 dark:bg-sidebar-accent"
                    }`}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                    </div>
                    <span className="text-sm font-medium">{item.title}</span>
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
