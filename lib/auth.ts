import { supabase } from "./supabase"
import type { User } from "./supabase"

export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    // For demo purposes, we'll simulate authentication
    // In a real app, you'd use Supabase auth
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !user) {
      console.error("Login error:", error)
      return null
    }

    // Store user in localStorage for demo
    localStorage.setItem("user", JSON.stringify(user))
    return user
  } catch (error) {
    console.error("Sign in error:", error)
    return null
  }
}

export async function signOut(): Promise<void> {
  localStorage.removeItem("user")
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("user")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from("users").select("*").order("name")

    if (error) {
      console.error("Error fetching users:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUsers:", error)
    return []
  }
}
