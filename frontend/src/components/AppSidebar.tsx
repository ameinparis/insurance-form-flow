import { Calculator, Home, FileText, Settings, LogOut, Moon, Sun, User, ChevronLeft, ChevronRight } from "lucide-react"
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
  // { title: "Basic Details", url: "/quote/personal-details", icon: User },
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

  return (
    <Sidebar className={`rounded-2xl shadow-md sticky top-0 h-[calc(100vh-10rem)] overflow-hidden transition-all duration-300 ${open ? 'w-64' : 'w-20'}`}>
      {/* Toggle Button */}
      {/* <div className="absolute -right-3 top-8 z-50">
        <button
          onClick={toggleSidebar}
          className="h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div> */}

      <SidebarContent className="px-4 pt-6 pb-12 flex flex-col gap-4 bg-transparent">
        <div className="text-center text-muted-foreground text-sm">
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
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
     ${isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"}
     ${!open ? "justify-center" : ""}`
                        }
                      >
                        {/* Inherit color from parent */}
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && (
                          <span className="text-sm transition-opacity duration-200">
                            {item.title}
                          </span>
                        )}
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


          {/* Settings Section */}
          <SidebarGroup>
            {open && (
              <div className="flex items-center gap-3 px-3 mb-4 mt-4">
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">SETTINGS</span>
                <div className="h-px flex-1 bg-border"></div>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <div className="px-3 py-4 border-t border-border/10">
              <div className={`flex items-center gap-3 transition-all duration-200 ${!open ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-3">
                  {isDarkMode ? <Moon className="h-5 w-5 text-foreground/60" /> : <Sun className="h-5 w-5 text-foreground/60" />}
                  {open && (
                    <span className="text-sm text-foreground transition-opacity duration-200">
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

            <SidebarGroupContent>
              <SidebarMenu className="space-y-4">
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                            ? "bg-muted text-foreground font-semibold"
                            : "text-foreground hover:bg-muted"
                          } ${!open ? 'justify-center' : ''}`
                        }

                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {open && <span className="text-sm transition-opacity duration-200">{item.title}</span>}
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