"use client"

import { redirect } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function Home() {
  const { user, isLoading } = useAuth()

  if (!isLoading) {
    if (user) {
      redirect("/ceiromao")
    } else {
      redirect("/login")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}
