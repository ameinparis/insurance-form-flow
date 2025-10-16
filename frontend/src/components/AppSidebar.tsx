import { Calculator, Home, FileText, Settings, LogOut, Moon, Sun, ChevronLeft } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
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
    <Sidebar className="bg-sidebar border-r border-sidebar-border/50 rounded-3xl m-4 shadow-sm">
      <SidebarHeader className="p-6 border-b border-sidebar-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary-gradient-from))] to-[hsl(var(--primary-gradient-to))] flex items-center justify-center shadow-md">
              <img src="/Assets/exclusive.png" alt="Exclusive Insurance Logo" className="h-7 w-7 object-contain brightness-0 invert" />
            </div>
            {open && (
              <div>
                <h2 className="font-bold text-sidebar-foreground text-base font-heading">EXCLUSIVE</h2>
                <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider font-medium">INSURANCE</p>
              </div>
            )}
          </div>
          <SidebarTrigger className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        `flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive 
                            ? "bg-gradient-to-r from-[hsl(var(--primary-gradient-from))] to-[hsl(var(--primary-gradient-to))] text-white font-medium shadow-lg shadow-primary/20" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent-hover"
                        }`
                      }
                    >
                      {({ isActive }) => (
                         <>
                          <div className="flex items-center gap-3">
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                            {open && <span className="text-sm">{item.title}</span>}
                          </div>
                          {!isActive && open && (
                            <svg className="h-4 w-4 opacity-40 group-hover:opacity-70 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Calculator as single item */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/calculator" 
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? "bg-gradient-to-r from-[hsl(var(--primary-gradient-from))] to-[hsl(var(--primary-gradient-to))] text-white font-medium shadow-lg shadow-primary/20" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent-hover"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Calculator className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                          {open && <span className="text-sm">Calculator</span>}
                        </div>
                        {!isActive && open && (
                          <svg className="h-4 w-4 opacity-40 group-hover:opacity-70 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/30 mt-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Dark mode toggle */}
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent-hover w-full justify-start transition-all duration-200 h-auto font-normal group"
                >
                  <div className="flex items-center gap-3">
                    {isDarkMode ? <Sun className="h-5 w-5 flex-shrink-0" /> : <Moon className="h-5 w-5 flex-shrink-0" />}
                    {open && <span className="text-sm">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
                  </div>
                  {open && (
                    <svg className="h-4 w-4 opacity-40 group-hover:opacity-70 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Button>
              </SidebarMenuItem>
              
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        `flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive 
                            ? "bg-gradient-to-r from-[hsl(var(--primary-gradient-from))] to-[hsl(var(--primary-gradient-to))] text-white font-medium shadow-lg shadow-primary/20" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent-hover"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                            {open && <span className="text-sm">{item.title}</span>}
                          </div>
                          {!isActive && open && (
                            <svg className="h-4 w-4 opacity-40 group-hover:opacity-70 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}