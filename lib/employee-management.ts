import { supabase } from "./supabase"
import type { Employee } from "./supabase"

export interface EmployeeFilters {
  search?: string
  department?: string
  position?: string
  category?: string
  status?: string
}

export interface EmployeeStats {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  byDepartment: { [key: string]: number }
  byCategory: { [key: string]: number }
}

export interface CreateEmployeeData {
  name: string
  employee_number: string
  email: string
  phone?: string
  department: string
  position: string
  category: "regular" | "teacher" | "outsourced"
  hire_date: string
  salary?: number
  status: "active" | "inactive"
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  id: string
}

export async function getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  try {
    let query = supabase.from("employees").select("*").order("name", { ascending: true })

    // Apply filters
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,employee_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
      )
    }

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

export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const { data, error } = await supabase.from("employees").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching employee by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getEmployeeById:", error)
    return null
  }
}

export async function createEmployee(employeeData: CreateEmployeeData): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .insert({
        ...employeeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

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

export async function updateEmployee(employeeData: UpdateEmployeeData): Promise<Employee | null> {
  try {
    const { id, ...updateData } = employeeData

    const { data, error } = await supabase
      .from("employees")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
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

export async function getEmployeeStats(): Promise<EmployeeStats> {
  try {
    const { data, error } = await supabase.from("employees").select("department, category, status")

    if (error) {
      console.error("Error fetching employee stats:", error)
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        byDepartment: {},
        byCategory: {},
      }
    }

    if (!data || data.length === 0) {
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        byDepartment: {},
        byCategory: {},
      }
    }

    const stats: EmployeeStats = {
      totalEmployees: data.length,
      activeEmployees: data.filter((emp) => emp.status === "active").length,
      inactiveEmployees: data.filter((emp) => emp.status === "inactive").length,
      byDepartment: {},
      byCategory: {},
    }

    // Count by department
    data.forEach((emp) => {
      if (emp.department) {
        stats.byDepartment[emp.department] = (stats.byDepartment[emp.department] || 0) + 1
      }
    })

    // Count by category
    data.forEach((emp) => {
      if (emp.category) {
        stats.byCategory[emp.category] = (stats.byCategory[emp.category] || 0) + 1
      }
    })

    return stats
  } catch (error) {
    console.error("Error in getEmployeeStats:", error)
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      byDepartment: {},
      byCategory: {},
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

    if (!data || data.length === 0) {
      return []
    }

    // Get unique departments
    const departments = [...new Set(data.map((emp) => emp.department).filter(Boolean))]
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

    if (!data || data.length === 0) {
      return []
    }

    // Get unique positions
    const positions = [...new Set(data.map((emp) => emp.position).filter(Boolean))]
    return positions.sort()
  } catch (error) {
    console.error("Error in getPositions:", error)
    return []
  }
}

export async function getCategories(): Promise<string[]> {
  return ["regular", "teacher", "outsourced"]
}

export async function bulkUpdateEmployees(updates: UpdateEmployeeData[]): Promise<boolean> {
  try {
    const promises = updates.map((update) => updateEmployee(update))
    const results = await Promise.all(promises)

    return results.every((result) => result !== null)
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

export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("department", department)
      .eq("status", "active")
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
      .eq("status", "active")
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
