import { supabase } from "./supabase"
import type { Employee } from "./supabase"

export async function getEmployees(): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        users!inner(*)
      `)
      .eq("is_active", true)
      .order("name", { ascending: true, foreignTable: "users" })

    if (error) {
      console.error("Error fetching employees:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching employees:", error)
    return []
  }
}

export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!UUID_REGEX.test(userId)) {
    console.warn("getEmployeeByUserId: invalid id – forcing re-login")
    return null
  }

  try {
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        users!inner(*)
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1) // ensure only one row is ever returned
      .maybeSingle() // returns null instead of error when 0 rows

    if (error) {
      console.error("Error fetching employee:", error)
      return null
    }

    return data ?? null
  } catch (error) {
    console.error("Error fetching employee:", error)
    return null
  }
}
