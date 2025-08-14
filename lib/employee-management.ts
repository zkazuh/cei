import { supabase } from "./supabase"
import type { Employee } from "./supabase"

export interface EmployeeStats {
  total: number
  active: number
  inactive: number
  byDepartment: Record<string, number>
  byCategory: Record<string, number>
  byPosition: Record<string, number>
}

export interface EmployeeFilters {
  department?: string
  position?: string
  category?: string
  status?: string
  search?: string
}

export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const { data, error } = await supabase.from("employees").select("*").order("name", { ascending: true })

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

export async function getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  try {
    let query = supabase.from("employees").select("*")

    if (filters?.department && filters.department !== "all") {
      query = query.eq("department", filters.department)
    }

    if (filters?.position && filters.position !== "all") {
      query = query.eq("position", filters.position)
    }

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category)
    }

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,employee_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
      )
    }

    const { data, error } = await query.order("name", { ascending: true })

    if (error) {
      console.error("Error fetching filtered employees:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getEmployees:", error)
    return []
  }
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
  try {
    const employees = await getAllEmployees()

    if (!employees || employees.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: {},
        byCategory: {},
        byPosition: {},
      }
    }

    const stats: EmployeeStats = {
      total: employees.length,
      active: employees.filter((emp) => emp.status === "active").length,
      inactive: employees.filter((emp) => emp.status === "inactive").length,
      byDepartment: {},
      byCategory: {},
      byPosition: {},
    }

    // Count by department
    employees.forEach((emp) => {
      if (emp.department) {
        stats.byDepartment[emp.department] = (stats.byDepartment[emp.department] || 0) + 1
      }
    })

    // Count by category
    employees.forEach((emp) => {
      if (emp.category) {
        stats.byCategory[emp.category] = (stats.byCategory[emp.category] || 0) + 1
      }
    })

    // Count by position
    employees.forEach((emp) => {
      if (emp.position) {
        stats.byPosition[emp.position] = (stats.byPosition[emp.position] || 0) + 1
      }
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
      byPosition: {},
    }
  }
}

export async function getDepartments(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("employees").select("department").not("department", "is", null)

    if (error) {
      console.error("Error fetching departments:", error)
      return []
    }

    const departments = [...new Set(data?.map((item) => item.department).filter(Boolean))]
    return departments.sort()
  } catch (error) {
    console.error("Error in getDepartments:", error)
    return []
  }
}

export async function getPositions(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("employees").select("position").not("position", "is", null)

    if (error) {
      console.error("Error fetching positions:", error)
      return []
    }

    const positions = [...new Set(data?.map((item) => item.position).filter(Boolean))]
    return positions.sort()
  } catch (error) {
    console.error("Error in getPositions:", error)
    return []
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("employees").select("category").not("category", "is", null)

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    const categories = [...new Set(data?.map((item) => item.category).filter(Boolean))]
    return categories.sort()
  } catch (error) {
    console.error("Error in getCategories:", error)
    return []
  }
}

export async function createEmployee(employee: Omit<Employee, "id" | "created_at" | "updated_at">): Promise<boolean> {
  try {
    const { error } = await supabase.from("employees").insert({
      ...employee,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

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

export async function updateEmployee(
  id: string,
  updates: Partial<Omit<Employee, "id" | "created_at" | "updated_at">>,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("employees")
      .update({
        ...updates,
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
      console.error("Error in bulk update employees")
      return false
    }

    return true
  } catch (error) {
    console.error("Error in bulkUpdateEmployees:", error)
    return false
  }
}

export async function searchEmployees(searchTerm: string): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .or(`name.ilike.%${searchTerm}%,employee_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order("name", { ascending: true })

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
