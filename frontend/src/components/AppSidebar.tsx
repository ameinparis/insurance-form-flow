import { Calculator, Home, FileText, Settings, LogOut, Moon, Sun, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

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
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <Sidebar className={cn(
      "bg-white dark:bg-sidebar-background rounded-[32px] shadow-md sticky top-0 h-[calc(100vh-7rem)] overflow-hidden transition-all duration-300 relative",
      isCollapsed ? "w-[72px]" : "w-56"
    )}>
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-white dark:bg-sidebar-background shadow-md border border-border/40 flex items-center justify-center hover:bg-muted/50 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      <SidebarContent className="flex flex-col h-full">
        {/* MENU Section */}
        <div className={cn("pt-5 pb-3", isCollapsed ? "px-2" : "px-4")}>
          {!isCollapsed && (
            <div className="mb-4">
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Menu</span>
            </div>
          )}

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-full transition-all duration-200 group",
                    isCollapsed ? "px-2 py-2 justify-center" : "px-2 py-2",
                    isActive
                      ? "bg-sidebar-active text-white"
                      : "text-foreground/70 dark:text-white hover:bg-muted/60 dark:hover:bg-sidebar-accent"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      "flex items-center justify-center rounded-full transition-all duration-200",
                      isCollapsed ? "w-8 h-8" : "w-8 h-8",
                      isActive 
                        ? "bg-white/20" 
                        : "bg-muted/50 dark:bg-sidebar-accent"
                    )}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    </div>
                    {!isCollapsed && (
                      <span className="text-xs font-medium">{item.title}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className={cn(isCollapsed ? "px-2" : "px-4", "py-2")}>
          <div className="h-px bg-border/30" />
        </div>

        {/* SETTINGS Section */}
        <div className={cn("pb-5 mt-auto", isCollapsed ? "px-2" : "px-4")}>
          {!isCollapsed && (
            <div className="mb-4">
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Settings</span>
            </div>
          )}

          {/* Light Mode Toggle */}
          <div className={cn(
            "flex items-center rounded-full hover:bg-muted/60 dark:hover:bg-sidebar-accent transition-all duration-200 mb-1",
            isCollapsed ? "px-2 py-2 justify-center" : "justify-between px-2 py-2"
          )}>
            <div className={cn("flex items-center", isCollapsed ? "" : "gap-3")}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 dark:bg-sidebar-accent">
                {isDarkMode ? <Moon className="h-4 w-4 text-foreground/70 dark:text-white" /> : <Sun className="h-4 w-4 text-foreground/70 dark:text-white" />}
              </div>
              {!isCollapsed && (
                <span className="text-xs font-medium text-foreground/70 dark:text-white">
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className="data-[state=checked]:bg-sidebar-active scale-75"
              />
            )}
          </div>

          <nav className="space-y-1">
            {settingsItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-full transition-all duration-200 group",
                    isCollapsed ? "px-2 py-2 justify-center" : "px-2 py-2",
                    isActive
                      ? "bg-sidebar-active text-white"
                      : "text-foreground/70 dark:text-white hover:bg-muted/60 dark:hover:bg-sidebar-accent"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
                      isActive 
                        ? "bg-white/20" 
                        : "bg-muted/50 dark:bg-sidebar-accent"
                    )}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    </div>
                    {!isCollapsed && (
                      <span className="text-xs font-medium">{item.title}</span>
                    )}
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
