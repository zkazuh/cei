import { supabase } from "./supabase"
import type { Employee } from "./supabase"

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

export async function getEmployeeStats() {
  try {
    const { data: employees, error } = await supabase.from("employees").select("*")

    if (error) {
      console.error("Error fetching employee stats:", error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        teachers: 0,
        regular: 0,
        outsourced: 0,
      }
    }

    const stats = {
      total: employees?.length || 0,
      active: 0,
      inactive: 0,
      teachers: 0,
      regular: 0,
      outsourced: 0,
    }

    employees?.forEach((employee) => {
      if (employee.status === "active") stats.active++
      else stats.inactive++

      if (employee.category === "teacher") stats.teachers++
      else if (employee.category === "regular") stats.regular++
      else if (employee.category === "outsourced") stats.outsourced++
    })

    return stats
  } catch (error) {
    console.error("Error in getEmployeeStats:", error)
    return {
      total: 0,
      active: 0,
      inactive: 0,
      teachers: 0,
      regular: 0,
      outsourced: 0,
    }
  }
}
