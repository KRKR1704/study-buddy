"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export function AccountSettings() {
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || ""

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Not authenticated")
      setLoading(false)
      return
    }
    axios
      .get(`${apiBase}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = res.data?.data || {}
        setFirstName(data.first_name || "")
        setLastName(data.last_name || "")
        setEmail(data.email || "")
      })
      .catch((e) => setError("Unable to load profile"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setError("")
    setMessage("")
    const token = localStorage.getItem("token")
    if (!token) return setError("Not authenticated")
    try {
      await axios.put(
        `${apiBase}/auth/profile`,
        { first_name: firstName, last_name: lastName, email },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage("Profile updated")
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Update failed")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete your account? This cannot be undone.")) return
    const token = localStorage.getItem("token")
    if (!token) return setError("Not authenticated")
    try {
      await axios.delete(`${apiBase}/auth/delete-account`, { headers: { Authorization: `Bearer ${token}` } })
      // clear auth and reload
      localStorage.removeItem("token")
      localStorage.removeItem("sb_user_id")
      localStorage.removeItem("sb_user")
      window.location.href = "/"
    } catch (err) {
      setError("Delete failed")
    }
  }

  const handleChangePassword = async () => {
    setError("")
    setMessage("")
    if (!currentPassword || !newPassword) return setError("Fill both password fields")
    if (newPassword !== confirmNewPassword) return setError("New passwords do not match")
    const token = localStorage.getItem("token")
    if (!token) return setError("Not authenticated")
    try {
      await axios.post(
        `${apiBase}/auth/change-password`,
        { old_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage("Password changed")
      // force logout so old tokens are not usable; require re-login after password change
      try {
        localStorage.removeItem("token")
        localStorage.removeItem("sb_user_id")
        localStorage.removeItem("sb_user")
      } catch {}
      // redirect to login
      window.location.href = "/"
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Password change failed")
    }
  }

  if (loading) return <div>Loading...</div>

  const initials = `${(firstName || "").slice(0, 1)}${(lastName || "").slice(0, 1)}`.toUpperCase()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your profile and security settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          {message && <p className="text-sm text-green-600 mb-3">{message}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName((e.target as HTMLInputElement).value)} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName((e.target as HTMLInputElement).value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} />
            </div>
          </div>

          <div className="mt-6">
            <Separator />
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Change Password</h3>
            <div className="grid gap-3">
              <div>
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword((e.target as HTMLInputElement).value)} />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword((e.target as HTMLInputElement).value)} />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword((e.target as HTMLInputElement).value)} />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword}>Change Password</Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">Signed in as {email || "—"}</div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete Account</Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
