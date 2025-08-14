import { supabase } from "./supabase"
import type { User } from "./supabase"

export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    // Get user from database
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !user) {
      return null
    }

    // For demo purposes, we'll skip bcrypt verification and use simple comparison
    // In production, you would use: const isValid = await bcrypt.compare(password, user.password_hash)
    const isValid =
      (email === "admin@ceiromao.com" && password === "admin123") ||
      (email === "employee@ceiromao.com" && password === "emp123") ||
      (email === "maria@ceiromao.com" && password === "maria123") ||
      (email === "carlos@ceiromao.com" && password === "carlos123") ||
      (email === "ana@ceiromao.com" && password === "ana123") ||
      (email === "pedro@ceiromao.com" && password === "pedro123") ||
      (email === "sofia@ceiromao.com" && password === "sofia123")

    if (!isValid) {
      return null
    }

    // Log the login activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "LOGIN",
      table_name: "users",
      record_id: user.id,
      new_values: { email, timestamp: new Date().toISOString() },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }
  } catch (error) {
    console.error("Sign in error:", error)
    return null
  }
}

export async function signOut(userId: string) {
  try {
    // Log the logout activity
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action: "LOGOUT",
      table_name: "users",
      record_id: userId,
      new_values: { timestamp: new Date().toISOString() },
    })
  } catch (error) {
    console.error("Sign out error:", error)
  }
}
