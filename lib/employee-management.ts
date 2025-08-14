import { supabase } from "./supabase"
import type { Employee } from "./supabase"

export interface EmployeeStats {
  total: number
  active: number
  inactive: number
  byDepartment: Record<string, number>
  byCategory: Record<string, number>
  recentHires: Employee[]
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
  try {
    const { data: employees, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching employee stats:", error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: {},
        byCategory: {},
        recentHires: [],
      }
    }

    if (!employees || employees.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: {},
        byCategory: {},
        recentHires: [],
      }
    }

    const stats: EmployeeStats = {
      total: employees.length,
      active: 0,
      inactive: 0,
      byDepartment: {},
      byCategory: {},
      recentHires: employees.slice(0, 5), // Get 5 most recent hires
    }

    employees.forEach((employee) => {
      // Count by status
      if (employee.status === "active") {
        stats.active++
      } else {
        stats.inactive++
      }

      // Count by department
      const dept = employee.department || "Unknown"
      stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1

      // Count by category
      const category = employee.category || "regular"
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error("Error in getEmployeeStats:", error)
    return {
      total: 0,
      active: 0,
      inactive: 0,
      byDepartment: {},
      byCategory: {},
      recentHires: [],
    }
  }
}

export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const { data, error } = await supabase.from("employees").select("*").order("name")

    if (error) {
      console.error("Error fetching employees:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllEmployees:", error)
    return []
  }
}

export async function getEmployeesByCategory(category: string): Promise<Employee[]> {
  try {
    const { data, error } = await supabase.from("employees").select("*").eq("category", category).order("name")

    if (error) {
      console.error("Error fetching employees by category:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getEmployeesByCategory:", error)
    return []
  }
}

export async function createEmployee(employee: Omit<Employee, "id" | "created_at" | "updated_at">): Promise<boolean> {
  try {
    const { error } = await supabase.from("employees").insert(employee)

    if (error) {
      console.error("Error creating employee:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in createEmployee:", error)
    return false
  }
}

export async function updateEmployee(id: string, employee: Partial<Employee>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("employees")
      .update({
        ...employee,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating employee:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateEmployee:", error)
    return false
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

export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const { data, error } = await supabase.from("employees").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching employee by id:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getEmployeeById:", error)
    return null
  }
}

export async function searchEmployees(query: string): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .or(
        `name.ilike.%${query}%,employee_number.ilike.%${query}%,department.ilike.%${query}%,position.ilike.%${query}%`,
      )
      .order("name")

    if (error) {
      console.error("Error searching employees:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in searchEmployees:", error)
    return []
  }
}

export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  try {
    const { data, error } = await supabase.from("employees").select("*").eq("department", department).order("name")

    if (error) {
      console.error("Error fetching employees by department:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getEmployeesByDepartment:", error)
    return []
  }
}

export async function getEmployeesByStatus(status: string): Promise<Employee[]> {
  try {
    const { data, error } = await supabase.from("employees").select("*").eq("status", status).order("name")

    if (error) {
      console.error("Error fetching employees by status:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getEmployeesByStatus:", error)
    return []
  }
}

export async function bulkUpdateEmployees(updates: Array<{ id: string; data: Partial<Employee> }>): Promise<boolean> {
  try {
    const promises = updates.map(({ id, data }) =>
      supabase
        .from("employees")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id),
    )

    const results = await Promise.all(promises)
    const hasErrors = results.some((result) => result.error)

    if (hasErrors) {
      console.error("Some employee updates failed")
      return false
    }

    return true
  } catch (error) {
    console.error("Error in bulkUpdateEmployees:", error)
    return false
  }
}
