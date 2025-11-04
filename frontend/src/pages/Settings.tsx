import { useEffect, useState } from "react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

const Settings = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [showAddUserModal, setShowAddUserModal] = useState(false)

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
      await axios.post("http://localhost:5002/api/users/register", newUser, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowAddUserModal(false)
      setNewUser({ firstName: "", lastName: "", email: "", role: "user" })
      // Refresh user list
      const res = await axios.get("http://localhost:5002/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const mapped = res.data.map((user: any, idx: number) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        initials: `${user.firstName[0] || ""}${user.lastName[0] || ""}`,
        bgColor: ["bg-green-500", "bg-yellow-500", "bg-red-500", "bg-blue-500"][idx % 4],
      }))
      setTeamMembers(mapped)
    } catch (err) {
      console.error("Add user error", err)
    }
  }


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token") // adjust if stored differently
        const res = await axios.get("http://localhost:5002/api/users", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const mapped = res.data.map((user: any, idx: number) => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          initials: `${user.firstName[0] || ""}${user.lastName[0] || ""}`,
          bgColor: ["bg-green-500", "bg-yellow-500", "bg-red-500", "bg-blue-500"][idx % 4],
        }))
        setTeamMembers(mapped)
      } catch (err) {
        console.error("Failed to fetch users", err)
      }
    }

    fetchUsers()
  }, [])


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account & Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          {/* <TabsTrigger value="access">Access Control</TabsTrigger> */}
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and account settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Enter your first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Enter your last name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="Enter your phone number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell us about yourself" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications about your account activity.
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features and promotions.
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Button visible to superusers only */}
              {teamMembers.find(member => member.email === localStorage.getItem("email") && member.role === "superuser") && (
                <div className="flex justify-end">
                  <Button onClick={() => setShowAddUserModal(true)}>+ Add User</Button>
                </div>
              )}

              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback className={`${member.bgColor} text-white font-semibold`}>
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === "superuser" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {showAddUserModal && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md space-y-4">
      <h2 className="text-xl font-semibold">Add New User</h2>
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
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setShowAddUserModal(false)}>Cancel</Button>
        <Button onClick={handleAddUser}>Add User</Button>
      </div>
    </div>
  </div>
)}



        {/* <TabsContent value="access" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>
                Manage user permissions and access levels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Admin Dashboard Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow access to the admin dashboard.
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quote Management</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow creating and managing quotes.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Management</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow managing user accounts.
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        <TabsContent value="audit" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                View system activity and user actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">User Login</p>
                      <p className="text-sm text-muted-foreground">ame busang logged in</p>
                    </div>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Quote Created</p>
                      <p className="text-sm text-muted-foreground">New life insurance quote #QT-2024-001</p>
                    </div>
                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Settings Updated</p>
                      <p className="text-sm text-muted-foreground">Email notifications enabled</p>
                    </div>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quote Status Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when quote status changes.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Maintenance</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about system maintenance.
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Settings