export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

// Demo authentication - replace with real auth in production
export async function login(email: string, password: string): Promise<AuthUser | null> {
  try {
    // Demo credentials - in production, use proper authentication
    const demoUsers = [
      { id: "550e8400-e29b-41d4-a716-446655440001", email: "admin@ceiromao.com", name: "Administrator", role: "admin" },
      { id: "550e8400-e29b-41d4-a716-446655440002", email: "hr@ceiromao.com", name: "HR Manager", role: "hr" },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        email: "teacher@ceiromao.com",
        name: "Teacher User",
        role: "teacher",
      },
    ]

    const user = demoUsers.find((u) => u.email === email)
    if (user && password === "demo123") {
      // Store in localStorage for demo
      localStorage.setItem("auth_user", JSON.stringify(user))
      return user
    }

    return null
  } catch (error) {
    console.error("Login error:", error)
    return null
  }
}

export function logout(): void {
  localStorage.removeItem("auth_user")
}

export function getCurrentUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem("auth_user")
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
