import { Calculator, Home, FileText, Settings, LogOut, Moon, Sun } from "lucide-react"
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
    <Sidebar className=" w-64 bg-white dark:bg-slate-200 rounded-[32px] shadow-md sticky top-0 h-[calc(100vh-7rem)] overflow-hidden ">
      <SidebarContent className="flex flex-col h-full">
        {/* MENU Section */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-6">
            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">Menu</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 group ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.title}</span>
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
          <div className="flex items-center justify-between px-4 py-2.5 mb-1 rounded-2xl hover:bg-muted/60 transition-all duration-200">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="h-5 w-5 text-foreground/70" /> : <Sun className="h-5 w-5 text-foreground/70" />}
              <span className="text-sm font-medium text-foreground/70">
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <nav className="space-y-1">
            {settingsItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 group ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </SidebarContent>
    </Sidebar>
  )

}