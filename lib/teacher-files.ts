import { supabase } from "./supabase"
import type { MonthlyFileRequirement, MonthlyFileRequirementWithEmployee, ActivityFile } from "./supabase"

export async function getMonthlyFileRequirements(filters?: {
  year?: number
  month?: number
  status?: string
  employeeId?: string
}): Promise<MonthlyFileRequirementWithEmployee[]> {
  try {
    let query = supabase
      .from("monthly_file_requirements")
      .select(`
        *,
        employee:employees(*),
        file:activity_files(*)
      `)
      .order("due_date", { ascending: false })

    if (filters?.year) {
      query = query.eq("year", filters.year)
    }
    if (filters?.month) {
      query = query.eq("month", filters.month)
    }
    if (filters?.status) {
      query = query.eq("status", filters.status)
    }
    if (filters?.employeeId) {
      query = query.eq("employee_id", filters.employeeId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching monthly file requirements:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMonthlyFileRequirements:", error)
    return []
  }
}

export async function createMonthlyFileRequirement(
  employeeId: string,
  year: number,
  month: number,
): Promise<MonthlyFileRequirement | null> {
  try {
    // Calculate due date (10th of the month)
    const dueDate = new Date(year, month - 1, 10).toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("monthly_file_requirements")
      .insert({
        employee_id: employeeId,
        year,
        month,
        due_date: dueDate,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating monthly file requirement:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createMonthlyFileRequirement:", error)
    return null
  }
}

export async function createCurrentMonthRequirements(): Promise<boolean> {
  try {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    // Get all teachers
    const { data: teachers, error: teachersError } = await supabase
      .from("employees")
      .select("id")
      .eq("category", "teacher")
      .eq("status", "active")

    if (teachersError || !teachers) {
      console.error("Error fetching teachers:", teachersError)
      return false
    }

    // Check which teachers already have requirements for this month
    const { data: existingRequirements, error: existingError } = await supabase
      .from("monthly_file_requirements")
      .select("employee_id")
      .eq("year", year)
      .eq("month", month)

    if (existingError) {
      console.error("Error checking existing requirements:", existingError)
      return false
    }

    const existingEmployeeIds = new Set(existingRequirements?.map((req) => req.employee_id) || [])

    // Create requirements for teachers who don't have them yet
    const newRequirements = teachers
      .filter((teacher) => !existingEmployeeIds.has(teacher.id))
      .map((teacher) => ({
        employee_id: teacher.id,
        year,
        month,
        due_date: new Date(year, month - 1, 10).toISOString().split("T")[0],
        status: "pending" as const,
      }))

    if (newRequirements.length === 0) {
      return true // No new requirements needed
    }

    const { error: insertError } = await supabase.from("monthly_file_requirements").insert(newRequirements)

    if (insertError) {
      console.error("Error creating monthly requirements:", insertError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in createCurrentMonthRequirements:", error)
    return false
  }
}

export async function updateRequirementStatus(
  requirementId: string,
  status: "pending" | "submitted" | "overdue",
  fileId?: string,
): Promise<boolean> {
  try {
    const updateData: any = { status }

    if (status === "submitted") {
      updateData.submitted_at = new Date().toISOString()
      if (fileId) {
        updateData.file_id = fileId
      }
    }

    const { error } = await supabase.from("monthly_file_requirements").update(updateData).eq("id", requirementId)

    if (error) {
      console.error("Error updating requirement status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateRequirementStatus:", error)
    return false
  }
}

export async function markOverdueRequirements(): Promise<boolean> {
  try {
    const today = new Date().toISOString().split("T")[0]

    const { error } = await supabase
      .from("monthly_file_requirements")
      .update({ status: "overdue" })
      .eq("status", "pending")
      .lt("due_date", today)

    if (error) {
      console.error("Error marking overdue requirements:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in markOverdueRequirements:", error)
    return false
  }
}

export async function getTeacherFileStats(): Promise<{
  total: number
  pending: number
  submitted: number
  overdue: number
}> {
  try {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    const { data, error } = await supabase
      .from("monthly_file_requirements")
      .select("status")
      .eq("year", year)
      .eq("month", month)

    if (error) {
      console.error("Error fetching teacher file stats:", error)
      return { total: 0, pending: 0, submitted: 0, overdue: 0 }
    }

    const stats = {
      total: data?.length || 0,
      pending: 0,
      submitted: 0,
      overdue: 0,
    }

    data?.forEach((req) => {
      if (req.status === "pending") stats.pending++
      else if (req.status === "submitted") stats.submitted++
      else if (req.status === "overdue") stats.overdue++
    })

    return stats
  } catch (error) {
    console.error("Error in getTeacherFileStats:", error)
    return { total: 0, pending: 0, submitted: 0, overdue: 0 }
  }
}

export async function uploadTeacherFile(
  employeeId: string,
  file: File,
  description?: string,
): Promise<ActivityFile | null> {
  try {
    // For now, we'll simulate file upload by creating a record
    // In a real implementation, you'd upload to Supabase Storage
    const fileName = file.name
    const filePath = `/teacher-files/${employeeId}/${Date.now()}-${fileName}`

    const { data, error } = await supabase
      .from("activity_files")
      .insert({
        employee_id: employeeId,
        file_name: fileName,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        description: description || "Monthly teacher file submission",
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error uploading teacher file:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in uploadTeacherFile:", error)
    return null
  }
}
