import { Calculator, Home, FileText, Settings, LogOut, Moon, Sun, ChevronLeft, ChevronRight } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Calculator", url: "/calculator", icon: Calculator },
  { title: "Quotation Management", url: "/quotes", icon: FileText },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logout", url: "/logout", icon: LogOut },
]

export function AppSidebar() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { open, toggleSidebar } = useSidebar()

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const allItems = [...menuItems, ...settingsItems]

  return (
    <Sidebar className={`rounded-2xl shadow-md sticky top-0 h-[calc(100vh-2rem)] overflow-hidden transition-all duration-300 ${open ? 'w-64' : 'w-20'}`}>
      {/* Toggle Button */}
      <div className="absolute -right-3 top-8 z-50">
        <button
          onClick={toggleSidebar}
          className="h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <SidebarContent className="px-4 pt-6 pb-6 flex flex-col gap-2 bg-transparent">
        <TooltipProvider delayDuration={0}>
          {/* Menu Items */}
          <nav className="flex flex-col gap-2">
            {allItems.map((item) => (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        isActive
                          ? "rounded-full px-3 py-2 bg-primary/10 ring-1 ring-primary/20"
                          : "rounded-full px-3 py-2"
                      } ${!open ? "justify-center px-2" : ""}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-200 ${
                            isActive
                              ? "bg-primary/10 border-primary/30"
                              : "bg-muted border-border hover:border-foreground/20"
                          }`}
                        >
                          <item.icon
                            className={`h-4 w-4 ${
                              isActive ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        {open && (
                          <span className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </TooltipTrigger>
                {!open && (
                  <TooltipContent side="right">
                    <p>{item.title}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {/* Dark Mode Toggle */}
          <div className="mt-auto pt-4 border-t border-border">
            <div className={`flex items-center gap-3 px-3 py-2 transition-all duration-200 ${!open ? 'justify-center px-2' : 'justify-between'}`}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border bg-muted border-border">
                  {isDarkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                </div>
                {open && (
                  <span className="text-sm font-medium text-foreground">
                    {isDarkMode ? "Dark Mode" : "Light Mode"}
                  </span>
                )}
              </div>
              {open && (
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                  className="data-[state=checked]:bg-primary"
                />
              )}
            </div>
          </div>
        </TooltipProvider>
      </SidebarContent>
    </Sidebar>
  )
}