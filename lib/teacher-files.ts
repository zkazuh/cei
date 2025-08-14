import { supabase } from "./supabase"
import type { MonthlyFileRequirement, Employee } from "./supabase"

export async function getTeachers(): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("category", "teacher")
      .eq("status", "active")
      .order("name")

    if (error) {
      console.error("Error fetching teachers:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getTeachers:", error)
    return []
  }
}

export async function getMonthlyRequirements(filters?: {
  teacherId?: string
  year?: number
  month?: number
  status?: string
}): Promise<MonthlyFileRequirement[]> {
  try {
    let query = supabase
      .from("monthly_file_requirements")
      .select(`
        *,
        employee:employees(*),
        activity_file:activity_files(*)
      `)
      .order("due_date", { ascending: false })

    if (filters?.teacherId && filters.teacherId !== "all") {
      query = query.eq("employee_id", filters.teacherId)
    }
    if (filters?.year) {
      query = query.eq("year", filters.year)
    }
    if (filters?.month) {
      query = query.eq("month", filters.month)
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    const { data, error } = await query

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

export async function uploadActivityFile(
  employeeId: string,
  file: File,
  year: number,
  month: number,
): Promise<{ success: boolean; message: string; fileId?: string }> {
  try {
    // Simulate file upload (in real app, use Supabase Storage or similar)
    const filePath = `activity-files/${employeeId}/${year}-${month}-${file.name}`

    // Create activity file record
    const { data: activityFile, error: fileError } = await supabase
      .from("activity_files")
      .insert({
        employee_id: employeeId,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()

    if (fileError) {
      console.error("Error creating activity file:", fileError)
      return { success: false, message: "Failed to create file record" }
    }

    // Update monthly requirement
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
      console.error("Error updating monthly requirement:", updateError)
      return { success: false, message: "Failed to update requirement status" }
    }

    return {
      success: true,
      message: "File uploaded successfully",
      fileId: activityFile.id,
    }
  } catch (error) {
    console.error("Error in uploadActivityFile:", error)
    return { success: false, message: "Upload failed" }
  }
}

export async function downloadActivityFile(
  fileId: string,
): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const { data, error } = await supabase.from("activity_files").select("*").eq("id", fileId).single()

    if (error || !data) {
      return { success: false, message: "File not found" }
    }

    // In a real app, return the actual file URL from storage
    // For demo, return a placeholder URL
    return {
      success: true,
      url: `/api/files/${fileId}`,
      message: "File ready for download",
    }
  } catch (error) {
    console.error("Error in downloadActivityFile:", error)
    return { success: false, message: "Download failed" }
  }
}

export async function getTeacherFileStats(): Promise<{
  totalRequirements: number
  submitted: number
  pending: number
  overdue: number
  byMonth: Record<string, { submitted: number; pending: number; overdue: number }>
}> {
  try {
    const { data, error } = await supabase
      .from("monthly_file_requirements")
      .select("status, month, year")
      .eq("year", new Date().getFullYear())

    if (error) {
      console.error("Error fetching teacher file stats:", error)
      return {
        totalRequirements: 0,
        submitted: 0,
        pending: 0,
        overdue: 0,
        byMonth: {},
      }
    }

    const stats = {
      totalRequirements: data?.length || 0,
      submitted: 0,
      pending: 0,
      overdue: 0,
      byMonth: {} as Record<string, { submitted: number; pending: number; overdue: number }>,
    }

    data?.forEach((req) => {
      // Overall stats
      if (req.status === "submitted") stats.submitted++
      else if (req.status === "pending") stats.pending++
      else if (req.status === "overdue") stats.overdue++

      // Monthly stats
      const monthKey = `${req.year}-${req.month.toString().padStart(2, "0")}`
      if (!stats.byMonth[monthKey]) {
        stats.byMonth[monthKey] = { submitted: 0, pending: 0, overdue: 0 }
      }
      stats.byMonth[monthKey][req.status as keyof (typeof stats.byMonth)[string]]++
    })

    return stats
  } catch (error) {
    console.error("Error in getTeacherFileStats:", error)
    return {
      totalRequirements: 0,
      submitted: 0,
      pending: 0,
      overdue: 0,
      byMonth: {},
    }
  }
}

export async function createMonthlyRequirements(year: number, month: number): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("create_monthly_requirements_for_teachers", {
      target_year: year,
      target_month: month,
    })

    if (error) {
      console.error("Error creating monthly requirements:", error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error("Error in createMonthlyRequirements:", error)
    return 0
  }
}

export async function updateOverdueRequirements(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("update_overdue_requirements")

    if (error) {
      console.error("Error updating overdue requirements:", error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error("Error in updateOverdueRequirements:", error)
    return 0
  }
}
