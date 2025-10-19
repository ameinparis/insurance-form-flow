import { Calculator, Home, FileText, Settings, LogOut, Moon, Sun, User } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"


const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Calculator", url: "/calculator", icon: Calculator },
  { title: "Quotation Management", url: "/quotes", icon: FileText },
  { title: "Basic Details", url: "/quote/personal-details", icon: User },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logout", url: "/logout", icon: LogOut },
]

export function AppSidebar() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { open } = useSidebar()

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <Sidebar className="bg-sidebar border-sidebar-border ml-4 mb-4 rounded-2xl shadow-xl w-64">
      <SidebarContent className="px-3 py-6 pb-8 flex flex-col h-full">
        {/* Logo Section */}
        <div className="px-3 pb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <img src="/exclusive.png" alt="Logo" className="h-6 w-6 object-contain brightness-0 invert" />
          </div>
          {open && (
            <div>
              <h2 className="font-bold text-sm text-foreground">EXCLUSIVE</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">INSURANCE</p>
            </div>
          )}
        </div>

        {/* Menu Section - Takes available space */}
        <div className="flex-1">
          <SidebarGroup>
            {open && (
              <div className="flex items-center gap-3 px-3 mb-4">
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">MENU</span>
                <div className="h-px flex-1 bg-border"></div>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-4">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                            isActive 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Bottom Section - Dark Mode + Settings */}
        <div className="mt-auto">
          {/* Dark Mode Toggle */}
          <div className="px-3 py-4 border-t border-border/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
                {open && (
                  <span className="text-sm text-muted-foreground">
                    {isDarkMode ? "Dark Mode" : "Light Mode"}
                  </span>
                )}
              </div>
              <Switch 
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          {/* Settings Section */}
          <SidebarGroup>
            {open && (
              <div className="flex items-center gap-3 px-3 mb-4 mt-4">
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">SETTINGS</span>
                <div className="h-px flex-1 bg-border"></div>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-4">
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                            isActive 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}