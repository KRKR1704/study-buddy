"use client"

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface SignupPageProps {
  onLoginClick: () => void
  onSignupSuccess: () => void
}

export function SignupPage({ onLoginClick, onSignupSuccess }: SignupPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    dob: "",
    username: "",
    password: ""
  })
  const [error, setError] = useState("")

  const handleSignup = async () => {
    const isValid = Object.values(form).every((v) => v !== "")
    if (!isValid) {
      setError("All fields are required")
      return
    }

    try {
      await axios.post("http://localhost:8000/auth/signup", form)
      onSignupSuccess()
    } catch (err) {
      setError("Signup failed. Try again with a different username.")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>Create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {["first_name", "last_name", "email", "phone", "dob", "username", "password"].map((field) => (
            <div key={field} className="grid gap-1">
              <Label htmlFor={field}>{field.replace("_", " ")}</Label>
              <Input
                id={field}
                name={field}
                type={field === "password" ? (showPassword ? "text" : "password") : "text"}
                value={(form as any)[field]}
                onChange={handleChange}
                placeholder={field}
                required
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-sm text-blue-500 text-left"
          >
            {showPassword ? "Hide password" : "Show password"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleSignup}>Sign Up</Button>
          <Button variant="link" onClick={onLoginClick}>Already have an account? Log in</Button>
        </div>
      </CardContent>
    </Card>
  )
}
