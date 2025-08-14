export interface User {
  id: string
  email: string
  name: string
  role: string
}

export async function login(email: string, password: string): Promise<User | null> {
  try {
    // For demo purposes, we'll use hardcoded credentials
    // In production, you would hash passwords and check against the database
    const demoUsers = [
      { email: "admin@ceiromao.com", password: "admin123", name: "Administrator", role: "admin" },
      { email: "employee@ceiromao.com", password: "emp123", name: "Employee User", role: "user" },
      { email: "maria@ceiromao.com", password: "maria123", name: "Maria Silva", role: "user" },
      { email: "carlos@ceiromao.com", password: "carlos123", name: "Carlos Santos", role: "user" },
      { email: "ana@ceiromao.com", password: "ana123", name: "Ana Costa", role: "user" },
      { email: "pedro@ceiromao.com", password: "pedro123", name: "Pedro Lima", role: "user" },
      { email: "sofia@ceiromao.com", password: "sofia123", name: "Sofia Oliveira", role: "user" },
    ]

    const user = demoUsers.find((u) => u.email === email && u.password === password)

    if (user) {
      const userData = {
        id: `user_${Date.now()}`,
        email: user.email,
        name: user.name,
        role: user.role,
      }

      // Store in localStorage for demo
      localStorage.setItem("user", JSON.stringify(userData))
      return userData
    }

    return null
  } catch (error) {
    console.error("Login error:", error)
    return null
  }
}

export function logout(): void {
  localStorage.removeItem("user")
}

export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
