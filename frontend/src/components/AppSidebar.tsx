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
  { title: "Team", url: "/settings?tab=team", icon: Users },
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
    <Sidebar className="w-56 bg-white dark:bg-sidebar-background rounded-[32px] shadow-md sticky top-0 h-[calc(100vh-7rem)] overflow-hidden">
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
                  `flex items-center gap-3 px-2 py-2 rounded-full transition-all duration-200 group ${
                    isActive
                      ? "bg-sidebar-active text-white"
                      : "text-foreground/70 dark:text-white hover:bg-muted/60 dark:hover:bg-sidebar-accent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                      isActive 
                        ? "bg-white/20" 
                        : "bg-muted/50 dark:bg-sidebar-accent"
                    }`}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    </div>
                    <span className="text-xs font-medium">{item.title}</span>
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

          {/* Light Mode Toggle */}
          <div className="flex items-center justify-between px-2 py-2 mb-1 rounded-full hover:bg-muted/60 dark:hover:bg-sidebar-accent transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 dark:bg-sidebar-accent">
                {isDarkMode ? <Moon className="h-4 w-4 text-foreground/70 dark:text-white" /> : <Sun className="h-4 w-4 text-foreground/70 dark:text-white" />}
              </div>
              <span className="text-xs font-medium text-foreground/70 dark:text-white">
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
              className="data-[state=checked]:bg-sidebar-active scale-75"
            />
          </div>

          <nav className="space-y-1">
            {settingsItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2 py-2 rounded-full transition-all duration-200 group ${
                    isActive
                      ? "bg-sidebar-active text-white"
                      : "text-foreground/70 dark:text-white hover:bg-muted/60 dark:hover:bg-sidebar-accent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                      isActive 
                        ? "bg-white/20" 
                        : "bg-muted/50 dark:bg-sidebar-accent"
                    }`}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    </div>
                    <span className="text-xs font-medium">{item.title}</span>
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
