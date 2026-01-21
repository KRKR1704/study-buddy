"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
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
    country_code: "+1",
    phone: "",
    dob: "",
    username: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // OTP modal state
  const [otpOpen, setOtpOpen] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpMsg, setOtpMsg] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  const handleSignup = async () => {
    // Basic client-side validation
    if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.dob || !form.username || !form.password) {
      setError("All fields are required")
      return
    }
    if (emailAvailable === false) {
      setError("Email is already in use")
      return
    }
    if (usernameAvailable === false) {
      setError("Username is already taken")
      return
    }

    try {
      // Single signup request — previously this fired twice which caused a "username not available" race
      const res = await api.post("/auth/signup", form)
      console.log("signup response:", res)
      const userId = res?.data?.user_id
      if (userId) localStorage.setItem("sb_user_id", userId)
      // remove legacy global sb_* keys to avoid cross-account leakage
      try {
        localStorage.removeItem("sb_summary")
        localStorage.removeItem("sb_keypoints")
        localStorage.removeItem("sb_flashcards")
        localStorage.removeItem("sb_quiz")
        localStorage.removeItem("sb_title")
      } catch {}

      // Instead of immediately routing to login, open OTP modal so user can verify
      setOtpOpen(true)
      setOtp("")
      setOtpError(null)
      setOtpMsg("✅ OTP sent. Please check your email.")
    } catch (err: any) {
      console.error("signup error:", err)
      // show server error if provided
      // Backend may return 400 with detail like "Username already exists" — surface that to user
      const detail = err?.response?.data?.detail
      if (detail) {
        setError(String(detail))
      } else {
        setError("Signup failed. Try again with a different username or email.")
      }
    }
  }

  const handleVerifyOtp = async () => {
    setOtpError(null)
    setOtpMsg(null)
    setOtpLoading(true)
    try {
      const res = await api.post("/auth/verify-otp", { email: form.email, otp })
      console.log("verify-otp response:", res)
      setOtpMsg("✅ Verified! Redirecting to login...")
      setTimeout(() => {
        setOtpOpen(false)
        onSignupSuccess()
      }, 700)
    } catch (err: any) {
      console.error("verify-otp error:", err)
      const detail = err?.response?.data?.detail
      setOtpError(detail || (err?.message || "OTP verification failed"))
    } finally {
      setOtpLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Check availability endpoints
  const checkEmail = async (email: string) => {
    if (!email) return
    try {
      const res = await api.get("/auth/check", { params: { email } })
      setEmailAvailable(res.data?.available === true)
    } catch {
      setEmailAvailable(null)
    }
  }

  const checkUsername = async (username: string) => {
    if (!username) return
    try {
      const res = await api.get("/auth/check", { params: { username } })
      setUsernameAvailable(res.data?.available === true)
    } catch {
      setUsernameAvailable(null)
    }
  }

  useEffect(() => {
    // when username changes, prepare some suggestions
    if (!form.username) {
      setSuggestions([])
      return
    }
    const base = form.username.replace(/[^a-zA-Z0-9]/g, "")
    const s = [base, `${base}${Math.floor(Math.random()*90)+10}`, `${base}_${Math.floor(Math.random()*900)+100}`].filter(Boolean)
    setSuggestions(s)
  }, [form.username])

  // simple phone validation per country code (length-based)
  const phoneRules: Record<string, number> = {
    "+1": 10, // US
    "+91": 10, // IN
    "+44": 10, // UK (local part typically 10)
    "+61": 9,  // AU
  }

  const validatePhone = (code: string, phone: string) => {
    const expected = phoneRules[code] || 7
    const digits = phone.replace(/\D/g, "")
    return digits.length === expected
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" />
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} onBlur={(e) => checkEmail(e.target.value)} placeholder="you@example.com" />
              {emailAvailable === false && <p className="text-red-500 text-sm">Email already in use</p>}
              {emailAvailable === true && <p className="text-green-600 text-sm">Email available</p>}
            </div>

            <div className="grid grid-cols-4 gap-2 items-end">
              <div className="col-span-1">
                <Label htmlFor="country_code">Code</Label>
                <select id="country_code" name="country_code" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} className="w-full border rounded px-2 py-1">
                  <option value="+1">+1 (US)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (AU)</option>
                </select>
              </div>
              <div className="col-span-3 grid gap-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="1234567890" />
                {form.phone && !validatePhone(form.country_code, form.phone) && <p className="text-red-500 text-sm">Phone number looks invalid for selected country</p>}
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" name="dob" type="date" value={form.dob} onChange={handleChange} />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={form.username} onChange={handleChange} onBlur={(e) => checkUsername(e.target.value)} placeholder="username" />
              {usernameAvailable === false && <p className="text-red-500 text-sm">Username taken</p>}
              {usernameAvailable === true && <p className="text-green-600 text-sm">Username available</p>}
              {suggestions.length > 0 && (
                <div className="mt-1 flex gap-2 flex-wrap">
                  {suggestions.map((s) => (
                    <button key={s} type="button" className="text-sm px-2 py-1 border rounded text-blue-600" onClick={() => setForm({ ...form, username: s })}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-1">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2 items-center">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-sm text-blue-500">{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSignup}>Sign Up</Button>
              <Button variant="link" onClick={onLoginClick}>Already have an account? Log in</Button>
            </div>
          </div>
        </CardContent>
      </Card>
        {/* OTP MODAL */}
      {otpOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "white",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Verify OTP</h3>
            </div>

              <p style={{ marginTop: 10, marginBottom: 10, opacity: 0.8 }}>
                Enter the OTP sent to <b>{form.email}</b>
              </p>

              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                inputMode="numeric"
                style={{
                  width: "100%",
                  padding: 12,
                  letterSpacing: 2,
                  marginBottom: 12,
                }}
              />

              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otp.trim().length === 0}
                style={{ width: "100%", padding: 10, fontWeight: 700 }}
              >
                {otpLoading ? "Verifying..." : "Verify"}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setResendMsg(null)
                  setResendLoading(true)
                  try {
                    const res = await api.post('/auth/resend-otp', null, { params: { email: form.email } })
                    setResendMsg('✅ OTP resent. Check your email.')
                  } catch (err: any) {
                    const detail = err?.response?.data?.detail
                    setResendMsg(detail || (err?.message || 'Failed to resend OTP'))
                  } finally {
                    setResendLoading(false)
                  }
                }}
                disabled={resendLoading}
                style={{ width: "100%", padding: 10, fontWeight: 700, marginTop: 10 }}
              >
                {resendLoading ? 'Resending...' : 'Resend OTP'}
              </button>

              {resendMsg && <p style={{ marginTop: 10 }}>{resendMsg}</p>}

              {otpMsg && <p style={{ marginTop: 10, color: "green" }}>{otpMsg}</p>}
              {otpError && <p style={{ marginTop: 10, color: "crimson" }}>❌ {otpError}</p>}

              <p style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
                Didn’t get the code? Check spam/junk.
              </p>
            </div>
          </div>
        )}
      </div>
  )
}
