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
  total: number
  regular: number
  teacher: number
  outsourced: number
  active: number
  inactive: number
}

export async function getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  try {
    let query = supabase.from("employees").select("*").order("name", { ascending: true })

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

export async function getEmployeeStats(): Promise<EmployeeStats> {
  try {
    const { data, error } = await supabase.from("employees").select("category, status")

    if (error) {
      console.error("Error fetching employee stats:", error)
      return { total: 0, regular: 0, teacher: 0, outsourced: 0, active: 0, inactive: 0 }
    }

    const stats = {
      total: data?.length || 0,
      regular: data?.filter((emp) => emp.category === "regular").length || 0,
      teacher: data?.filter((emp) => emp.category === "teacher").length || 0,
      outsourced: data?.filter((emp) => emp.category === "outsourced").length || 0,
      active: data?.filter((emp) => emp.status === "active").length || 0,
      inactive: data?.filter((emp) => emp.status === "inactive").length || 0,
    }

    return stats
  } catch (error) {
    console.error("Error in getEmployeeStats:", error)
    return { total: 0, regular: 0, teacher: 0, outsourced: 0, active: 0, inactive: 0 }
  }
}

export async function getDepartments(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("employees").select("department").not("department", "is", null)

    if (error) {
      console.error("Error fetching departments:", error)
      return []
    }

    const departments = [...new Set(data?.map((emp) => emp.department).filter(Boolean))]
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

    const positions = [...new Set(data?.map((emp) => emp.position).filter(Boolean))]
    return positions.sort()
  } catch (error) {
    console.error("Error in getPositions:", error)
    return []
  }
}

export async function getEmployee(id: string): Promise<Employee | null> {
  try {
    const { data, error } = await supabase.from("employees").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching employee:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getEmployee:", error)
    return null
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

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<boolean> {
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

export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const { data, error } = await supabase.from("employees").select("*").order("name")

    if (error) {
      console.error("Error fetching all employees:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAllEmployees:", error)
    return []
  }
}
