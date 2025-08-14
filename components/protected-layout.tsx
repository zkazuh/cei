"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"

interface ProtectedLayoutProps {
  children: React.ReactNode
  requiredRole?: "admin" | "employee" | "teacher"
}

export function ProtectedLayout({ children, requiredRole }: ProtectedLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user && requiredRole && user.role !== requiredRole && user.role !== "admin") {
      router.push("/ceiromao")
    }
  }, [user, requiredRole, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
