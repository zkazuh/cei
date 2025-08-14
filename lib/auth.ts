interface User {
  id: string
  email: string
  role: string
}

export function login(email: string, password: string): User | null {
  // Demo authentication - in production, this would validate against a real backend
  const demoUsers = [
    { id: "1", email: "admin@ceiromao.com", role: "admin" },
    { id: "2", email: "hr@ceiromao.com", role: "hr" },
    { id: "3", email: "teacher@ceiromao.com", role: "teacher" },
  ]

  const user = demoUsers.find((u) => u.email === email)
  if (user) {
    localStorage.setItem("user", JSON.stringify(user))
    return user
  }
  return null
}

export function logout(): void {
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

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
