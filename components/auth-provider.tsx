"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signIn, signOut } from "@/lib/auth"
import type { User } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ✅ helper – simple UUID v4 regexp
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("ceiromao_user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        // 🍃 validate uuid
        if (UUID_REGEX.test(parsed.id)) {
          setUser(parsed)
        } else {
          // stale mock session - clear it
          localStorage.removeItem("ceiromao_user")
        }
      } catch {
        localStorage.removeItem("ceiromao_user")
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Redirect logic
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        router.push("/login")
      } else if (user && pathname === "/login") {
        router.push("/ceiromao")
      }
    }
  }, [user, pathname, isLoading, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const userData = await signIn(email, password)

      if (userData) {
        setUser(userData)
        localStorage.setItem("ceiromao_user", JSON.stringify(userData))
        setIsLoading(false)
        return true
      }
    } catch (error) {
      console.error("Login error:", error)
    }

    setIsLoading(false)
    return false
  }

  const logout = async () => {
    if (user) {
      await signOut(user.id)
    }
    setUser(null)
    localStorage.removeItem("ceiromao_user")
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
