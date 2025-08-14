"use client"

import { useState } from "react"
import { LoginPage } from "./login-page"
import { SignupPage } from "./signup-page"

interface AuthWrapperProps {
  onAuthSuccess: () => void
}

export function AuthWrapper({ onAuthSuccess }: AuthWrapperProps) {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div>
      {isLogin ? (
        <LoginPage
          onSignupClick={() => setIsLogin(false)}
          onLoginSuccess={onAuthSuccess}
        />
      ) : (
        <SignupPage
          onLoginClick={() => setIsLogin(true)}
          onSignupSuccess={() => setIsLogin(true)}  // ✅ Fixed: redirect to login only
        />
      )}
    </div>
  )
}
