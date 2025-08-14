"use client"

import { useEffect, useState } from "react"

interface AnimatedAvatarProps {
  emailLength: number // This will now represent username length
  isPasswordFocused: boolean
  isPasswordVisible: boolean
  isTyping: boolean
}

export function AnimatedAvatar({ emailLength, isPasswordFocused, isPasswordVisible, isTyping }: AnimatedAvatarProps) {
  const [eyePosition, setEyePosition] = useState(0)

  useEffect(() => {
    // Move eyes based on username length (simulate following text)
    const maxPosition = 8
    const position = Math.min(emailLength * 0.8, maxPosition)
    setEyePosition(position)
  }, [emailLength])

  const getEyeState = () => {
    if (isPasswordFocused && !isPasswordVisible) return "closed"
    if (isPasswordFocused && isPasswordVisible) return "peeking"
    return "open"
  }

  const getMouthState = () => {
    if (isPasswordFocused && !isPasswordVisible) return "worried"
    if (isPasswordFocused && isPasswordVisible) return "surprised"
    if (isTyping) return "happy"
    return "neutral"
  }

  const eyeState = getEyeState()
  const mouthState = getMouthState()

  return (
    <div className="flex justify-center mb-6">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
          {/* Head */}
          <circle cx="60" cy="60" r="45" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />

          {/* Glasses */}
          <g>
            {/* Left lens */}
            <circle cx="45" cy="50" r="12" fill="rgba(255,255,255,0.3)" stroke="#374151" strokeWidth="2" />
            {/* Right lens */}
            <circle cx="75" cy="50" r="12" fill="rgba(255,255,255,0.3)" stroke="#374151" strokeWidth="2" />
            {/* Bridge */}
            <line x1="57" y1="50" x2="63" y2="50" stroke="#374151" strokeWidth="2" />
          </g>

          {/* Eyes */}
          <g>
            {eyeState === "closed" ? (
              <>
                <line x1="40" y1="50" x2="50" y2="50" stroke="#374151" strokeWidth="2" />
                <line x1="70" y1="50" x2="80" y2="50" stroke="#374151" strokeWidth="2" />
              </>
            ) : eyeState === "peeking" ? (
              <>
                <ellipse cx="45" cy="50" rx="4" ry="2" fill="#1f2937" />
                <ellipse cx="75" cy="50" rx="4" ry="2" fill="#1f2937" />
              </>
            ) : (
              <>
                {/* Left eye */}
                <circle cx="45" cy="50" r="4" fill="white" />
                <circle
                  cx={45 + eyePosition * 0.3}
                  cy="50"
                  r="2"
                  fill="#1f2937"
                  style={{ transition: "cx 0.2s ease" }}
                />

                {/* Right eye */}
                <circle cx="75" cy="50" r="4" fill="white" />
                <circle
                  cx={75 + eyePosition * 0.3}
                  cy="50"
                  r="2"
                  fill="#1f2937"
                  style={{ transition: "cx 0.2s ease" }}
                />
              </>
            )}
          </g>

          {/* Cheeks (when typing) */}
          {isTyping && (
            <>
              <circle cx="25" cy="65" r="6" fill="#fca5a5" opacity="0.6" />
              <circle cx="95" cy="65" r="6" fill="#fca5a5" opacity="0.6" />
            </>
          )}

          {/* Mouth */}
          <g>
            {mouthState === "worried" && (
              <path d="M 50 75 Q 60 70 70 75" stroke="#374151" strokeWidth="2" fill="none" />
            )}
            {mouthState === "surprised" && <ellipse cx="60" cy="75" rx="6" ry="8" fill="#374151" />}
            {mouthState === "happy" && <path d="M 50 75 Q 60 85 70 75" stroke="#374151" strokeWidth="2" fill="none" />}
            {mouthState === "neutral" && <circle cx="60" cy="75" r="2" fill="#374151" />}
          </g>

          {/* Floating particles when typing */}
          {isTyping && (
            <g>
              <circle cx="30" cy="30" r="1" fill="#60a5fa" opacity="0.7">
                <animate attributeName="cy" values="30;20;30" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="90" cy="35" r="1" fill="#34d399" opacity="0.7">
                <animate attributeName="cy" values="35;25;35" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="20" cy="80" r="1" fill="#fbbf24" opacity="0.7">
                <animate attributeName="cy" values="80;70;80" dur="1.8s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
