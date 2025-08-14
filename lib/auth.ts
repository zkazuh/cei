// Demo users for authentication (in production, use proper password hashing)
const DEMO_USERS = [
  { email: "admin@ceiromao.com", password: "admin123", role: "admin", name: "Administrator" },
  { email: "employee@ceiromao.com", password: "emp123", role: "user", name: "Employee User" },
  { email: "maria@ceiromao.com", password: "maria123", role: "user", name: "Maria Silva" },
  { email: "carlos@ceiromao.com", password: "carlos123", role: "user", name: "Carlos Santos" },
  { email: "ana@ceiromao.com", password: "ana123", role: "user", name: "Ana Costa" },
  { email: "pedro@ceiromao.com", password: "pedro123", role: "user", name: "Pedro Lima" },
  { email: "sofia@ceiromao.com", password: "sofia123", role: "user", name: "Sofia Oliveira" },
  { email: "joao@ceiromao.com", password: "joao123", role: "user", name: "João Pereira" },
]

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  try {
    // Check demo users first
    const demoUser = DEMO_USERS.find((u) => u.email === email && u.password === password)
    if (demoUser) {
      const authUser: AuthUser = {
        id: `demo-${email}`,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      }

      // Store in localStorage for persistence
      localStorage.setItem("auth_user", JSON.stringify(authUser))
      return authUser
    }

    // In production, you would check against the database
    // const { data, error } = await supabase
    //   .from("users")
    //   .select("*")
    //   .eq("email", email)
    //   .single()

    return null
  } catch (error) {
    console.error("Sign in error:", error)
    return null
  }
}

export async function signOut(): Promise<void> {
  try {
    localStorage.removeItem("auth_user")
  } catch (error) {
    console.error("Sign out error:", error)
  }
}

export function getCurrentUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem("auth_user")
    if (stored) {
      return JSON.parse(stored)
    }
    return null
  } catch (error) {
    console.error("Get current user error:", error)
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
