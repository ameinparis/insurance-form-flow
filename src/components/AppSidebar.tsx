import { Calculator, Home, FileText, Settings, LogOut, Moon, Sun, ChevronDown, ChevronRight } from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

// Calculator submenu items
const calculatorItems = [
  { title: "Life Funeral Quotation", url: "/calculator/life-funeral" },
  { title: "Living Annuities Quotation", url: "/calculator/living-annuities" },
  { title: "Group Life Assurance (GLA)", url: "/calculator/group-life-assurance" },
  { title: "Credit Life Cover", url: "/calculator/credit-life" },
  { title: "Critical Illness Cover", url: "/calculator/critical-illness" },
  { title: "Occupational Disability", url: "/calculator/occupational-disability" },
  { title: "Individual Life Cover", url: "/calculator/individual-life" },
]

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Quotation Management", url: "/quotes", icon: FileText },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logout", url: "/logout", icon: LogOut },
]

export function AppSidebar() {
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <Sidebar className="bg-white rounded-2xl shadow-sm border-0">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-lg">X</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">EXCLUSIVE</h2>
            <p className="text-xs text-gray-500 uppercase tracking-wide">LIFE INSURANCE</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-4">
            MENU
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 ${
                          isActive ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600" : ""
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Calculator with submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setCalculatorOpen(!calculatorOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Calculator className="h-4 w-4" />
                  <span className="text-sm flex-1">Calculator</span>
                  {calculatorOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </SidebarMenuButton>
                {calculatorOpen && (
                  <SidebarMenuSub className="ml-4 mt-2 space-y-1">
                    {calculatorItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild>
                          <NavLink 
                            to={item.url}
                            className={({ isActive }) =>
                              `flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-xs ${
                                isActive ? "bg-blue-50 text-blue-600" : ""
                              }`
                            }
                          >
                            {item.title}
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-4">
            SETTINGS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {/* Dark mode toggle */}
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 w-full justify-start"
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span className="text-sm">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </Button>
              </SidebarMenuItem>
              
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 ${
                          isActive ? "bg-blue-50 text-blue-600" : ""
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
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