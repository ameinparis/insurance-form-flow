import { useState } from "react"
import { Calculator, Home, FileText, Settings, LogOut, Users, ShieldCheck, ChevronDown, FilePlus, FolderOpen } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar"

const quotationChildren = [
  { title: "New Quote", url: "/calculator", icon: FilePlus },
  { title: "Quote Management", url: "/quotes", icon: FolderOpen },
]

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  {
    title: "Quotations",
    icon: FileText,
    children: quotationChildren,
  },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Administration", url: "/administration", icon: ShieldCheck },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logout", url: "/logout", icon: LogOut },
]

export function AppSidebar() {
  const { pathname } = useLocation()
  const quotationsActive = quotationChildren.some((c) => pathname.startsWith(c.url))
  const [quotationsOpen, setQuotationsOpen] = useState(quotationsActive)

  return (
    <Sidebar variant="inset" className="w-64 bg-card rounded-[40px] sticky top-0 h-[calc(100vh-7rem)] overflow-hidden border-0 shadow-sm">
      <SidebarContent className="flex flex-col h-full">
        {/* MENU Section */}
        <div className="px-4 pt-5 pb-3">
          <div className="mb-4">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Menu</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              if (item.children) {
                const isGroupActive = item.children.some((c) => pathname.startsWith(c.url))
                const open = quotationsOpen || isGroupActive
                return (
                  <div key={item.title}>
                    <button
                      type="button"
                      onClick={() => setQuotationsOpen((v) => !v)}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 group ${
                        isGroupActive
                          ? "text-foreground dark:text-white"
                          : "text-foreground/70 dark:text-white hover:bg-sidebar-accent-hover"
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 dark:bg-sidebar-accent transition-all duration-200">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                      </div>
                      <span className="text-[13px] font-medium whitespace-nowrap flex-1 text-left">{item.title}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="mt-1 ml-4 pl-3 border-l border-border/40 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.title}
                            to={child.url}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 ${
                                isActive
                                  ? "bg-sidebar-active text-sidebar-active-foreground"
                                  : "text-foreground/70 dark:text-white hover:bg-sidebar-accent-hover"
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${
                                  isActive ? "bg-white/20" : "bg-muted/50 dark:bg-sidebar-accent"
                                }`}>
                                  <child.icon className="h-3.5 w-3.5 flex-shrink-0" />
                                </div>
                                <span className="text-[12.5px] font-medium whitespace-nowrap">{child.title}</span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <NavLink
                  key={item.title}
                  to={item.url!}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-sidebar-active text-sidebar-active-foreground"
                        : "text-foreground/70 dark:text-white hover:bg-sidebar-accent-hover"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                        isActive ? "bg-white/20" : "bg-muted/50 dark:bg-sidebar-accent"
                      }`}>
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                      </div>
                      <span className="text-[13px] font-medium whitespace-nowrap">{item.title}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
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

          <nav className="space-y-1">
            {settingsItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-sidebar-active text-sidebar-active-foreground"
                      : item.title === "Logout"
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-foreground/70 dark:text-white hover:bg-sidebar-accent-hover"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-white/20"
                        : item.title === "Logout"
                          ? "bg-red-50 dark:bg-red-900/20"
                          : "bg-muted/50 dark:bg-sidebar-accent"
                    }`}>
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${item.title === "Logout" ? "text-red-500" : ""}`} />
                    </div>
                    <span className={`text-sm font-medium ${item.title === "Logout" ? "text-red-500" : ""}`}>{item.title}</span>
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
