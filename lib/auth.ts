import { supabase } from "./supabase"
import type { User } from "./supabase"

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", credentials.email).single()

    if (error || !data) {
      return {
        success: false,
        error: "Invalid email or password",
      }
    }

    // In a real app, you would hash and compare passwords
    // For demo purposes, we'll use simple string comparison
    if (data.email === credentials.email) {
      return {
        success: true,
        user: data,
      }
    }

    return {
      success: false,
      error: "Invalid email or password",
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      error: "Login failed. Please try again.",
    }
  }
}

export async function logout(): Promise<void> {
  // In a real app, you would clear session/tokens
  // For demo purposes, we'll just clear localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  try {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user))
  }
}
