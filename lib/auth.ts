import { supabase } from "./supabase"
import bcrypt from "bcryptjs"

export async function login(username: string, password: string) {
  try {
    const { data: user, error } = await supabase.from("users").select("*").eq("username", username).single()

    if (error || !user) {
      return { success: false, error: "User not found" }
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return { success: false, error: "Invalid password" }
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Login failed" }
  }
}
