import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserPlus, Users } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  initials: string
  bgColor: string
  isActive?: boolean
}

const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewUser((prev) => ({ ...prev, role: e.target.value }))
  }

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem("token")
      await axios.post("https://njs.exclusivelife.co.bw/api/users/register", newUser, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowAddUserModal(false)
      setNewUser({ firstName: "", lastName: "", email: "", role: "user" })
      fetchUsers()
    } catch (err) {
      console.error("Add user error", err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const res = await axios.get("https://njs.exclusivelife.co.bw/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const mapped = res.data.map((user: any, idx: number) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        initials: `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`,
        bgColor: ["bg-green-500", "bg-yellow-500", "bg-red-500", "bg-blue-500"][idx % 4],
        isActive: user.isActive !== false,
      }))
      setTeamMembers(mapped)
      
      // Check if current user is superuser
      const currentEmail = localStorage.getItem("email")
      const currentMember = mapped.find((m: TeamMember) => m.email === currentEmail)
      if (currentMember) {
        setCurrentUserRole(currentMember.role)
      }
    } catch (err) {
      console.error("Failed to fetch users", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const getRoleBadgeClass = (role: string) => {
    if (role === "superuser") {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700"
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700"
  }

  const getStatusBadgeClass = (isActive: boolean) => {
    if (isActive) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700"
    }
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Team</h2>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
        </div>
        {currentUserRole === "superuser" && (
          <Button onClick={() => setShowAddUserModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading team members...</CardContent></Card>
      ) : teamMembers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-4">Add your first team member to get started.</p>
            {currentUserRole === "superuser" && (
              <Button onClick={() => setShowAddUserModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-gray-50/30 dark:bg-slate-900/30 rounded-xl p-6">
          <div className="overflow-x-auto">
            <Table className="border-separate border-spacing-y-3 w-full">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                    Member
                  </TableHead>
                  <TableHead className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                    Email
                  </TableHead>
                  <TableHead className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                    Role
                  </TableHead>
                  <TableHead className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-gray-200 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 my-2 overflow-hidden"
                  >
                    <TableCell className="py-5 px-6 rounded-l-xl">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={`${member.bgColor} text-white font-semibold`}>
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300 font-normal">
                      {member.email}
                    </TableCell>
                    <TableCell className="py-5 px-6">
                      <Badge
                        variant="outline"
                        className={`rounded-full px-2 py-1.5 text-xs font-medium border capitalize ${getRoleBadgeClass(member.role)}`}
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 px-6 rounded-r-xl">
                      <Badge
                        variant="outline"
                        className={`rounded-full px-2 py-1.5 text-xs font-medium border ${getStatusBadgeClass(member.isActive !== false)}`}
                      >
                        {member.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-xl font-semibold">Add New Member</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input name="firstName" value={newUser.firstName} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input name="lastName" value={newUser.lastName} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" value={newUser.email} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={newUser.role}
                onChange={handleRoleChange}
                className="w-full border px-3 py-2 rounded-md text-sm dark:bg-gray-800"
              >
                <option value="user">User</option>
                <option value="superuser">Superuser</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddUserModal(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>Add Member</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Team
