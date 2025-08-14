import { supabase } from "./supabase"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: "admin" | "user"
}

// Demo credentials for development
const DEMO_USERS = [
  { email: "admin@ceiromao.com", password: "admin123", name: "Administrator", role: "admin" as const },
  { email: "employee@ceiromao.com", password: "emp123", name: "Employee User", role: "user" as const },
  { email: "maria@ceiromao.com", password: "maria123", name: "Maria Silva", role: "user" as const },
  { email: "carlos@ceiromao.com", password: "carlos123", name: "Carlos Santos", role: "user" as const },
  { email: "ana@ceiromao.com", password: "ana123", name: "Ana Costa", role: "user" as const },
]

export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  try {
    // For demo purposes, use hardcoded credentials
    const demoUser = DEMO_USERS.find((u) => u.email === email && u.password === password)

    if (demoUser) {
      const authUser: AuthUser = {
        id: `demo-${demoUser.email}`,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      }

      // Store in localStorage for persistence
      localStorage.setItem("auth_user", JSON.stringify(authUser))

      return authUser
    }

    // In production, you would verify against the database
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !data) {
      return null
    }

    // In production, you would verify the password hash
    // For demo, we'll accept any password for database users
    const authUser: AuthUser = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
    }

    localStorage.setItem("auth_user", JSON.stringify(authUser))
    return authUser
  } catch (error) {
    console.error("Sign in error:", error)
    return null
  }
}

export function signOut(): void {
  localStorage.removeItem("auth_user")
}

export function getCurrentUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem("auth_user")
    if (stored) {
      return JSON.parse(stored)
    }
    return null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === "admin"
}
