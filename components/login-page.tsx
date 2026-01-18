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


interface LoginPageProps {
  onSignupClick: () => void
  onLoginSuccess: () => void
}

export function LoginPage({ onSignupClick, onLoginSuccess }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const handleLogin = async () => {
    setError("")
    try {
      const response = await axios.post("http://localhost:8000/auth/login", {
        username,
        password,
      })
      const { access_token, user_id } = response.data
      if (access_token) {
        localStorage.setItem("token", access_token)
      }
      if (user_id) localStorage.setItem("sb_user_id", user_id)
      // remove legacy global summary keys so a previous user's global cache doesn't leak
      try {
        localStorage.removeItem("sb_summary")
        localStorage.removeItem("sb_keypoints")
        localStorage.removeItem("sb_flashcards")
        localStorage.removeItem("sb_quiz")
        localStorage.removeItem("sb_title")
      } catch {}
      onLoginSuccess()
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (detail) {
        setError(String(detail))
      } else {
        setError("Invalid username or password")
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[380px]">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your username and password below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <form
              className="w-full grid gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                handleLogin()
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setIsTyping(true)
                    // Clear typing indicator after 800ms of inactivity
                    window.clearTimeout((window as any).__sb_typing_timeout)
                    ;(window as any).__sb_typing_timeout = window.setTimeout(() => setIsTyping(false), 800)
                  }}
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
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
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
                <div className="text-right">
                  <button type="button" className="text-sm text-blue-600" onClick={async () => {
                    const email = window.prompt("Enter your account email to receive a reset token:")
                    if (!email) return
                    try {
                      const res = await axios.post("http://localhost:8000/auth/forgot-password", null, { params: { email } })
                      // In dev the API returns the token so show it; in production this would be emailed
                      if (res.data?.reset_token) {
                        alert(`Password reset token (dev): ${res.data.reset_token}`)
                      } else {
                        alert(res.data?.message || 'If an account exists, a reset link was sent.')
                      }
                    } catch (e: any) {
                      alert(e?.response?.data?.detail || 'Unable to request password reset')
                    }
                  }}>Forgot password?</button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={!username || !password}>Login</Button>
                <Button type="button" variant="link" onClick={onSignupClick}>Don't have an account? Sign up</Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
