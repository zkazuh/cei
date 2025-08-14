import { supabase } from "./supabase"
import type { Employee } from "./supabase"

export async function getEmployees(filters?: {
  department?: string
  status?: string
  category?: string
}): Promise<Employee[]> {
  try {
    let query = supabase.from("employees").select("*").order("name")

    if (filters?.department && filters.department !== "all") {
      query = query.eq("department", filters.department)
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }
    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching employees:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getEmployees:", error)
    return []
  }
}

export async function createEmployee(
  employee: Omit<Employee, "id" | "created_at" | "updated_at">,
): Promise<Employee | null> {
  try {
    const { data, error } = await supabase.from("employees").insert(employee).select().single()

    if (error) {
      console.error("Error creating employee:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createEmployee:", error)
    return null
  }
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating employee:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in updateEmployee:", error)
    return null
  }
}

export async function deleteEmployee(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("employees").delete().eq("id", id)

    if (error) {
      console.error("Error deleting employee:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteEmployee:", error)
    return false
  }
}

export async function getEmployeeStats(): Promise<{
  total: number
  active: number
  inactive: number
  byCategory: Record<string, number>
  byDepartment: Record<string, number>
}> {
  try {
    const { data, error } = await supabase.from("employees").select("status, category, department")

    if (error) {
      console.error("Error fetching employee stats:", error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byCategory: {},
        byDepartment: {},
      }
    }

    const stats = {
      total: data?.length || 0,
      active: 0,
      inactive: 0,
      byCategory: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>,
    }

    data?.forEach((employee) => {
      // Status counts
      if (employee.status === "active") stats.active++
      else if (employee.status === "inactive") stats.inactive++

      // Category counts
      stats.byCategory[employee.category] = (stats.byCategory[employee.category] || 0) + 1

      // Department counts
      stats.byDepartment[employee.department] = (stats.byDepartment[employee.department] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error("Error in getEmployeeStats:", error)
    return {
      total: 0,
      active: 0,
      inactive: 0,
      byCategory: {},
      byDepartment: {},
    }
  }
}
