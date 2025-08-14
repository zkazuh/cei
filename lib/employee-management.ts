import { supabase } from "./supabase"
import type { Employee } from "./supabase"

export interface EmployeeStats {
  total: number
  active: number
  inactive: number
  byDepartment: Record<string, number>
  byPosition: Record<string, number>
  byCategory: Record<string, number>
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

    query = query.order("name", { ascending: true })

    const { data, error } = await query

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
    const { data, error } = await supabase.from("employees").select("department, position, category, status")

    if (error) {
      console.error("Error fetching employee stats:", error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: {},
        byPosition: {},
        byCategory: {},
      }
    }

    if (!data || data.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: {},
        byPosition: {},
        byCategory: {},
      }
    }

    const stats: EmployeeStats = {
      total: data.length,
      active: data.filter((emp) => emp.status === "active").length,
      inactive: data.filter((emp) => emp.status === "inactive").length,
      byDepartment: {},
      byPosition: {},
      byCategory: {},
    }

    data.forEach((employee) => {
      // Count by department
      if (employee.department) {
        stats.byDepartment[employee.department] = (stats.byDepartment[employee.department] || 0) + 1
      }

      // Count by position
      if (employee.position) {
        stats.byPosition[employee.position] = (stats.byPosition[employee.position] || 0) + 1
      }

      // Count by category
      if (employee.category) {
        stats.byCategory[employee.category] = (stats.byCategory[employee.category] || 0) + 1
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
      byPosition: {},
      byCategory: {},
    }
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

export async function updateEmployee(
  employeeId: string,
  updates: Partial<Omit<Employee, "id" | "created_at" | "updated_at">>,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("employees")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId)

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

export async function deleteEmployee(employeeId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("employees").delete().eq("id", employeeId)

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

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  try {
    const { data, error } = await supabase.from("employees").select("*").eq("id", employeeId).single()

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

export async function getDepartments(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("employees").select("department").not("department", "is", null)

    if (error) {
      console.error("Error fetching departments:", error)
      return []
    }

    const departments = [...new Set(data?.map((emp) => emp.department).filter(Boolean))] as string[]
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

    const positions = [...new Set(data?.map((emp) => emp.position).filter(Boolean))] as string[]
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

    const categories = [...new Set(data?.map((emp) => emp.category).filter(Boolean))] as string[]
    return categories.sort()
  } catch (error) {
    console.error("Error in getCategories:", error)
    return []
  }
}

export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("department", department)
      .order("name", { ascending: true })

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

export async function getEmployeesByCategory(category: string): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("category", category)
      .order("name", { ascending: true })

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

export async function bulkUpdateEmployees(
  employeeIds: string[],
  updates: Partial<Omit<Employee, "id" | "created_at" | "updated_at">>,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("employees")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in("id", employeeIds)

    if (error) {
      console.error("Error bulk updating employees:", error)
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
      .or(
        `name.ilike.%${searchTerm}%,employee_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`,
      )
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
