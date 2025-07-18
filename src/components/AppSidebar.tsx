import { Calculator, Home, FileText, User, Settings, LogOut, FormInput, PiggyBank } from "lucide-react"
import { NavLink } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Basic Details", url: "/basic-details", icon: User },
  { title: "Forms", url: "/forms", icon: FormInput },
  { title: "Annuity Calculator", url: "/calculate", icon: Calculator },
  { title: "Quotation Management", url: "/quotes", icon: FileText },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logout", url: "/logout", icon: LogOut },
]

export function AppSidebar() {
  return (
    <Sidebar className="bg-white border-r">
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