import { Calculator, Home, FileText, Settings, LogOut, Moon, Sun } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"


const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Quotation Management", url: "/quotes", icon: FileText },
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
    <Sidebar className="bg-sidebar border-sidebar-border m-4 rounded-2xl shadow-xl">
      <SidebarContent className="px-3 py-6">
        {/* Menu Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground font-medium shadow-sm" 
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
              
              {/* Calculator */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/calculator" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive 
                          ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`
                    }
                  >
                    <Calculator className="h-5 w-5 flex-shrink-0" />
                    {open && <span className="text-sm">Calculator</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground font-medium shadow-sm" 
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
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/30 mt-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon className="h-5 w-5 text-sidebar-foreground" /> : <Sun className="h-5 w-5 text-sidebar-foreground" />}
            {open && (
              <Label htmlFor="dark-mode" className="text-sm text-sidebar-foreground cursor-pointer">
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </Label>
            )}
          </div>
          <Switch 
            id="dark-mode"
            checked={isDarkMode}
            onCheckedChange={toggleDarkMode}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}