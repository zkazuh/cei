import { supabase } from "./supabase"
import type { User } from "./supabase"

export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    // In a real app, you would hash the password and compare
    // For demo purposes, we'll use simple password matching
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !data) {
      console.error("User not found:", error)
      return null
    }

    // Simple password check (in production, use proper hashing)
    const validPasswords: Record<string, string> = {
      "admin@ceiromao.com": "admin123",
      "employee@ceiromao.com": "emp123",
      "maria@ceiromao.com": "maria123",
      "carlos@ceiromao.com": "carlos123",
      "ana@ceiromao.com": "ana123",
    }

    if (validPasswords[email] !== password) {
      console.error("Invalid password")
      return null
    }

    return data
  } catch (error) {
    console.error("Error in signIn:", error)
    return null
  }
}

export async function signOut(): Promise<void> {
  // Clear any stored session data
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    if (typeof window === "undefined") return null

    const userData = localStorage.getItem("user")
    if (!userData) return null

    return JSON.parse(userData)
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
