import { useState, useEffect } from "react"
import {
  Calculator,
  Home,
  FileText,
  FolderOpen,
  FilePlus2,
  Settings,
  LogOut,
  Users,
  ClipboardList,
  ShieldCheck,
  ChevronDown,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar"
import { usePermissions } from "@/lib/authlibrary"

const quotationItems = [
  { title: "New Quote", url: "/calculator", icon: FilePlus2 },
  { title: "Quote Management", url: "/quotes", icon: FolderOpen },
]

const menuItems = [
  { title: "Clients", url: "/clients", icon: Users, permission: null },
  { title: "Claims", url: "/claims", icon: ClipboardList, permission: null },
  {
    title: "Administration",
    url: "/administration",
    icon: ShieldCheck,
    permission: "canManageUsers" as const,
  },
]

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logout", url: "/logout", icon: LogOut },
]

const baseLink =
  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
const activeLink = "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
const idleLink =
  "text-foreground/70 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"

export function AppSidebar() {
  const { pathname } = useLocation()
  const permissions = usePermissions()
  const visibleMenuItems = menuItems.filter(
    (item) => !item.permission || permissions[item.permission],
  )
  const quotationsActive = quotationItems.some((i) => pathname.startsWith(i.url))
  const [quotationsOpen, setQuotationsOpen] = useState(quotationsActive)

  useEffect(() => {
    if (quotationsActive) setQuotationsOpen(true)
  }, [quotationsActive])

  return (
    <Sidebar variant="inset" className="w-64 bg-card rounded-[40px] sticky top-0 h-[calc(100vh-7rem)] overflow-hidden border-0 shadow-sm">
      <SidebarContent className="flex flex-col h-full">
        {/* MENU Section */}
        <div className="px-4 pt-5 pb-3">
          <div className="mb-4">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Menu</span>
          </div>

          <nav className="space-y-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-500" />
                  )}
                  <Home className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                  <span className="text-[13px] font-semibold whitespace-nowrap">Dashboard</span>
                </>
              )}
            </NavLink>

            {/* Quotations group */}
            <div>
              <button
                type="button"
                onClick={() => setQuotationsOpen((o) => !o)}
                aria-expanded={quotationsOpen}
                className={`${baseLink} w-full ${quotationsActive ? activeLink : idleLink}`}
              >
                {quotationsActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-500" />
                )}
                <FileText className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                <span className="text-[13px] font-semibold whitespace-nowrap">Quotations</span>
                <ChevronDown
                  className={`h-4 w-4 ml-auto transition-transform duration-200 ${quotationsOpen ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </button>

              {quotationsOpen && (
                <div className="mt-1 ml-4 space-y-1">
                  {quotationItems.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                          isActive ? activeLink : idleLink
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                      <span className="text-[12.5px] font-medium whitespace-nowrap">{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {visibleMenuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) => `${baseLink} ${isActive ? activeLink : idleLink}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-500" />
                    )}
                    <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                    <span className="text-[13px] font-semibold whitespace-nowrap">{item.title}</span>
                  </>
                )}
              </NavLink>
            ))}
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

          <nav className="space-y-2">
            {settingsItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  `${baseLink} ${
                    isActive
                      ? activeLink
                      : item.title === "Logout"
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : idleLink
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-500" />
                    )}
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${item.title === "Logout" ? "text-red-500" : ""}`} strokeWidth={2} />
                    <span className={`text-[13px] font-semibold ${item.title === "Logout" ? "text-red-500" : ""}`}>{item.title}</span>
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
