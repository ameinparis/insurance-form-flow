import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserPlus, Users, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageLoader } from "@/components/PageLoader"
import { toast } from "sonner"
import { DeleteMemberDialog } from "@/components/team/DeleteMemberDialog"

interface TeamMember {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  role: string
  initials: string
  bgColor: string
  borderColor: string
  isActive?: boolean
}

const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null)
  const [addLoading, setAddLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null)

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  })

  const [editUser, setEditUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setNewUser((prev) => ({ ...prev, role: value }))
  }

  const handleEditRoleChange = (value: string) => {
    setEditUser((prev) => ({ ...prev, role: value }))
  }

  const validateAddUser = () => {
    if (!newUser.firstName.trim()) {
      toast.error("First name is required")
      return false
    }
    if (!newUser.lastName.trim()) {
      toast.error("Last name is required")
      return false
    }
    if (!newUser.email.trim()) {
      toast.error("Email is required")
      return false
    }
    if (!newUser.role) {
      toast.error("Role is required")
      return false
    }
    return true
  }

  const validateEditUser = () => {
    if (!editUser.firstName.trim()) {
      toast.error("First name is required")
      return false
    }
    if (!editUser.lastName.trim()) {
      toast.error("Last name is required")
      return false
    }
    if (!editUser.email.trim()) {
      toast.error("Email is required")
      return false
    }
    if (!editUser.role) {
      toast.error("Role is required")
      return false
    }
    return true
  }

  const handleAddUser = async () => {
    if (!validateAddUser()) return
    setAddLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.post("https://njs.exclusivelife.co.bw/api/users/register", newUser, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Member added successfully")
      setShowAddUserModal(false)
      setNewUser({ firstName: "", lastName: "", email: "", role: "" })
      fetchUsers()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to add member"
      toast.error(errorMessage)
      console.error("Add user error", err)
    } finally {
      setAddLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!validateEditUser()) return
    if (!editingUser) return
    setEditLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.put(`https://njs.exclusivelife.co.bw/api/users/${editingUser.id}`, editUser, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Member updated successfully")
      setShowEditUserModal(false)
      setEditingUser(null)
      setEditUser({ firstName: "", lastName: "", email: "", role: "" })
      fetchUsers()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to update member"
      toast.error(errorMessage)
      console.error("Edit user error", err)
    } finally {
      setEditLoading(false)
    }
  }

  const openEditModal = (member: TeamMember) => {
    setEditingUser(member)
    setEditUser({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
    })
    setShowEditUserModal(true)
  }

  const handleDeleteUser = async () => {
    if (!deletingMember) return
    setDeleteLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`https://njs.exclusivelife.co.bw/api/users/${deletingMember.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Member deleted successfully")
      setDeletingMember(null)
      fetchUsers()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to delete member"
      toast.error(errorMessage)
      console.error("Delete user error", err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleToggleStatus = async (member: TeamMember) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(`https://njs.exclusivelife.co.bw/api/users/${member.id}`, {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        role: member.role,
        isActive: member.isActive === false,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(`Member ${member.isActive === false ? "activated" : "deactivated"} successfully`)
      fetchUsers()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to update status"
      toast.error(errorMessage)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const res = await axios.get("https://njs.exclusivelife.co.bw/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const pastelColors = [
        { bg: "bg-blue-100 text-blue-600", border: "border-blue-400" },
        { bg: "bg-green-100 text-green-600", border: "border-green-400" },
        { bg: "bg-purple-100 text-purple-600", border: "border-purple-400" },
        { bg: "bg-pink-100 text-pink-600", border: "border-pink-400" },
        { bg: "bg-orange-100 text-orange-600", border: "border-orange-400" },
        { bg: "bg-teal-100 text-teal-600", border: "border-teal-400" },
        { bg: "bg-indigo-100 text-indigo-600", border: "border-indigo-400" },
        { bg: "bg-rose-100 text-rose-600", border: "border-rose-400" }
      ]
      const mapped = res.data.map((user: any, idx: number) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        initials: `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`,
        bgColor: pastelColors[idx % pastelColors.length].bg,
        borderColor: pastelColors[idx % pastelColors.length].border,
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
        <Button onClick={() => setShowAddUserModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {loading ? (
        <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0"><CardContent className="py-6"><PageLoader /></CardContent></Card>
      ) : teamMembers.length === 0 ? (
        <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-4">Add your first team member to get started.</p>
            {currentUserRole?.toLowerCase() === "superuser" && (
              <Button onClick={() => setShowAddUserModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-6">
          <div className="overflow-x-auto">
            <Table className="border-separate border-spacing-y-3 w-full">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-gray-100 dark:bg-slate-700/50 border-0 rounded-full">
                  <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs rounded-l-full">
                    Member
                  </TableHead>
                  <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs">
                    Email
                  </TableHead>
                  <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs">
                    Role
                  </TableHead>
                  <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs">
                    Status
                  </TableHead>
                  {currentUserRole?.toLowerCase() === "superuser" && (
                    <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs text-right rounded-r-full">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-700 transition-all duration-200 my-2 overflow-hidden"
                  >
                    <TableCell className="py-5 px-6 rounded-l-xl">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-10 w-10 border-2 ${member.borderColor}`}>
                          <AvatarFallback className={`${member.bgColor} font-semibold`}>
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
                    <TableCell className={`py-5 px-6 ${currentUserRole?.toLowerCase() !== "superuser" ? "rounded-r-xl" : ""}`}>
                      {currentUserRole?.toLowerCase() === "superuser" ? (
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2 py-1.5 text-xs font-medium border cursor-pointer transition-colors ${getStatusBadgeClass(member.isActive !== false)}`}
                          onClick={() => handleToggleStatus(member)}
                          title="Click to toggle status"
                        >
                          {member.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2 py-1.5 text-xs font-medium border ${getStatusBadgeClass(member.isActive !== false)}`}
                        >
                          {member.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    {(
                      <TableCell className="py-5 px-6 text-right rounded-r-xl">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal(member)}
                            title="Edit User"
                          >
                            <Pencil className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => setDeletingMember(member)}
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="bg-white dark:bg-slate-900 rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input name="firstName" value={newUser.firstName} onChange={handleInputChange} className="mt-1" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input name="lastName" value={newUser.lastName} onChange={handleInputChange} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" value={newUser.email} onChange={handleInputChange} className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="superuser">Superuser</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddUserModal(false)} disabled={addLoading}>Cancel</Button>
              <Button onClick={handleAddUser} disabled={addLoading}>
                {addLoading ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="bg-white dark:bg-slate-900 rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input name="firstName" value={editUser.firstName} onChange={handleEditInputChange} className="mt-1" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input name="lastName" value={editUser.lastName} onChange={handleEditInputChange} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" value={editUser.email} onChange={handleEditInputChange} className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editUser.role} onValueChange={handleEditRoleChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="superuser">Superuser</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditUserModal(false)} disabled={editLoading}>Cancel</Button>
              <Button onClick={handleEditUser} disabled={editLoading}>
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteMemberDialog
        open={!!deletingMember}
        onOpenChange={(open) => { if (!open) setDeletingMember(null) }}
        memberName={deletingMember?.name || ""}
        memberEmail={deletingMember?.email || ""}
        onConfirm={handleDeleteUser}
        loading={deleteLoading}
      />
    </div>
  )
}

export default Team
