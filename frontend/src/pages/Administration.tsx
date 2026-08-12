import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Percent, Landmark } from "lucide-react"
import Team from "./Team"
import FeeConfiguration from "@/components/admin/FeeConfiguration"
import InvestmentManagers from "@/components/admin/InvestmentManagers"
import { useAuth } from "@/lib/authlibrary"
import { roleLabel } from "@/lib/permissions"

const Administration = () => {
  const { userRole, permissions } = useAuth()
  const [tab, setTab] = useState("users")

  return (
    <div className="-m-6">
      <div className="sticky top-0 z-30 bg-card px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight">Administration</h2>
            <p className="text-muted-foreground">
              Manage users, fee percentages and investment managers.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            {roleLabel(userRole)}
          </span>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-1">
            <TabsTrigger value="users" className="rounded-xl gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            {permissions.canConfigureFees && (
              <TabsTrigger value="fees" className="rounded-xl gap-2">
                <Percent className="h-4 w-4" />
                Fee Configuration
              </TabsTrigger>
            )}
            {permissions.canManageInvestments && (
              <TabsTrigger value="investments" className="rounded-xl gap-2">
                <Landmark className="h-4 w-4" />
                Investment Managers
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      <div className="px-6 pb-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsContent value="users" className="mt-0">
            <Team embedded />
          </TabsContent>
          {permissions.canConfigureFees && (
            <TabsContent value="fees" className="mt-0">
              <FeeConfiguration />
            </TabsContent>
          )}
          {permissions.canManageInvestments && (
            <TabsContent value="investments" className="mt-0">
              <InvestmentManagers />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

export default Administration
