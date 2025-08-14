import { supabase } from "./supabase"
import type { MonthlyFileRequirement } from "./supabase"

export async function getMonthlyRequirements(): Promise<MonthlyFileRequirement[]> {
  try {
    const { data, error } = await supabase
      .from("monthly_file_requirements")
      .select(`
        *,
        employee:employees(name, employee_number)
      `)
      .order("due_date", { ascending: false })

    if (error) {
      console.error("Error fetching monthly requirements:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMonthlyRequirements:", error)
    return []
  }
}

export async function getOverdueRequirements(): Promise<MonthlyFileRequirement[]> {
  try {
    const { data, error } = await supabase
      .from("monthly_file_requirements")
      .select(`
        *,
        employee:employees(name, employee_number)
      `)
      .eq("status", "overdue")
      .order("due_date", { ascending: true })

    if (error) {
      console.error("Error fetching overdue requirements:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getOverdueRequirements:", error)
    return []
  }
}

export async function getTeacherFileStats() {
  try {
    const { data: requirements, error } = await supabase.from("monthly_file_requirements").select("status")

    if (error) {
      console.error("Error fetching teacher file stats:", error)
      return {
        total: 0,
        submitted: 0,
        pending: 0,
        overdue: 0,
      }
    }

    const stats = {
      total: requirements?.length || 0,
      submitted: 0,
      pending: 0,
      overdue: 0,
    }

    requirements?.forEach((req) => {
      if (req.status === "submitted") stats.submitted++
      else if (req.status === "pending") stats.pending++
      else if (req.status === "overdue") stats.overdue++
    })

    return stats
  } catch (error) {
    console.error("Error in getTeacherFileStats:", error)
    return {
      total: 0,
      submitted: 0,
      pending: 0,
      overdue: 0,
    }
  }
}

export async function updateOverdueRequirements(): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0]

    const { error } = await supabase
      .from("monthly_file_requirements")
      .update({ status: "overdue" })
      .eq("status", "pending")
      .lt("due_date", today)

    if (error) {
      console.error("Error updating overdue requirements:", error)
    }
  } catch (error) {
    console.error("Error in updateOverdueRequirements:", error)
  }
}
