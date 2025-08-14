"use client"

import type React from "react"
import { useState } from "react"
import axios from "axios"
import { Eye, EyeOff, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AnimatedAvatar } from "./animated-avatar"

interface LoginPageProps {
  onSignupClick: () => void
  onLoginSuccess: () => void
}

export function LoginPage({ onSignupClick, onLoginSuccess }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:8000/auth/login", {
        username,
        password
      })
      const { access_token } = response.data
      localStorage.setItem("token", access_token)
      onLoginSuccess()
    } catch (err) {
      setError("Invalid username or password")
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your username and password below</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleLogin}>Login</Button>
          <Button variant="link" onClick={onSignupClick}>Don't have an account? Sign up</Button>
        </div>
      </CardContent>
    </Card>
  )
}
