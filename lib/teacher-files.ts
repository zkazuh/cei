import { supabase } from "./supabase"
import type { MonthlyFileRequirement, Employee } from "./supabase"

export async function getTeacherFileRequirements(): Promise<(MonthlyFileRequirement & { employee: Employee })[]> {
  try {
    const { data, error } = await supabase
      .from("monthly_file_requirements")
      .select(`
        *,
        employee:employees(*)
      `)
      .order("due_date", { ascending: false })

    if (error) {
      console.error("Error fetching teacher file requirements:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getTeacherFileRequirements:", error)
    return []
  }
}

export async function getTeacherFileStats(): Promise<{
  total: number
  submitted: number
  pending: number
  overdue: number
  byMonth: Record<string, number>
}> {
  try {
    const { data, error } = await supabase.from("monthly_file_requirements").select("status, month, year")

    if (error) {
      console.error("Error fetching teacher file stats:", error)
      return {
        total: 0,
        submitted: 0,
        pending: 0,
        overdue: 0,
        byMonth: {},
      }
    }

    const stats = {
      total: data?.length || 0,
      submitted: 0,
      pending: 0,
      overdue: 0,
      byMonth: {} as Record<string, number>,
    }

    data?.forEach((requirement) => {
      // Status counts
      if (requirement.status === "submitted") {
        stats.submitted++
      } else if (requirement.status === "pending") {
        stats.pending++
      } else if (requirement.status === "overdue") {
        stats.overdue++
      }

      // Month counts
      const monthKey = `${requirement.year}-${requirement.month.toString().padStart(2, "0")}`
      stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error("Error in getTeacherFileStats:", error)
    return {
      total: 0,
      submitted: 0,
      pending: 0,
      overdue: 0,
      byMonth: {},
    }
  }
}

export async function uploadTeacherFile(employeeId: string, file: File, year: number, month: number): Promise<boolean> {
  try {
    // Simulate file upload - in production, this would upload to actual storage
    const mockFileData = {
      employee_id: employeeId,
      filename: file.name,
      file_path: `/uploads/${employeeId}/${year}/${month}/${file.name}`,
      file_size: file.size,
      mime_type: file.type,
    }

    const { data: activityFile, error: fileError } = await supabase
      .from("activity_files")
      .insert(mockFileData)
      .select()
      .single()

    if (fileError) {
      console.error("Error uploading file:", fileError)
      return false
    }

    // Update the monthly requirement
    const { error: updateError } = await supabase
      .from("monthly_file_requirements")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        activity_file_id: activityFile.id,
      })
      .eq("employee_id", employeeId)
      .eq("year", year)
      .eq("month", month)

    if (updateError) {
      console.error("Error updating requirement:", updateError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in uploadTeacherFile:", error)
    return false
  }
}

export async function downloadTeacherFile(fileId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.from("activity_files").select("*").eq("id", fileId).single()

    if (error) {
      console.error("Error fetching file:", error)
      return null
    }

    // In production, this would return the actual file URL
    return data.file_path
  } catch (error) {
    console.error("Error in downloadTeacherFile:", error)
    return null
  }
}

export async function updateOverdueRequirements(): Promise<void> {
  try {
    const today = new Date()
    const { error } = await supabase
      .from("monthly_file_requirements")
      .update({ status: "overdue" })
      .eq("status", "pending")
      .lt("due_date", today.toISOString().split("T")[0])

    if (error) {
      console.error("Error updating overdue requirements:", error)
    }
  } catch (error) {
    console.error("Error in updateOverdueRequirements:", error)
  }
}
