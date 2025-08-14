import { supabase } from "./supabase"
import type { User } from "./supabase"

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // For demo purposes, we'll use a simple authentication
    // In production, you'd want proper password hashing
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !data) {
      return { user: null, error: "Invalid credentials" }
    }

    // In a real app, you'd verify the password hash here
    // For demo, we'll accept any password for existing users
    return { user: data, error: null }
  } catch (error) {
    return { user: null, error: "Authentication failed" }
  }
}

export async function signOut(): Promise<void> {
  // In a real app, you'd handle session cleanup here
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
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

export function setCurrentUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
  }
}
