"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getCurrentUser, setCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUserState(currentUser)
    setIsLoading(false)
  }, [])

  const setUser = (user: User | null) => {
    setUserState(user)
    if (user) {
      setCurrentUser(user)
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
      }
    }
  }

  return <AuthContext.Provider value={{ user, setUser, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
