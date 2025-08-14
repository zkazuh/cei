import { supabase } from "./supabase"

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "admin" | "user"
}

export async function login(credentials: LoginCredentials): Promise<{
  success: boolean
  user?: AuthUser
  message: string
}> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", credentials.email).single()

    if (error || !data) {
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    // In a real app, you would hash and compare passwords
    // For demo purposes, we'll accept any password for existing users
    const isValidPassword = true // bcrypt.compare(credentials.password, data.password_hash)

    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    return {
      success: true,
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
      },
      message: "Login successful",
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      message: "Login failed. Please try again.",
    }
  }
}

export async function logout(): Promise<void> {
  // In a real app, you would clear server-side sessions
  // For now, we'll just clear client-side storage
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth-user")
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem("auth-user")
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function setCurrentUser(user: AuthUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth-user", JSON.stringify(user))
  }
}
