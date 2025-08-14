import { supabase } from "./supabase"
import type { Employee, MonthlyFileRequirement } from "./supabase"

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
      .select("status, year, month")
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

    data?.forEach((requirement) => {
      // Status counts
      if (requirement.status === "submitted") stats.submitted++
      else if (requirement.status === "pending") stats.pending++
      else if (requirement.status === "overdue") stats.overdue++

      // Monthly breakdown
      const monthKey = `${requirement.year}-${requirement.month.toString().padStart(2, "0")}`
      if (!stats.byMonth[monthKey]) {
        stats.byMonth[monthKey] = { submitted: 0, pending: 0, overdue: 0 }
      }

      if (requirement.status === "submitted") stats.byMonth[monthKey].submitted++
      else if (requirement.status === "pending") stats.byMonth[monthKey].pending++
      else if (requirement.status === "overdue") stats.byMonth[monthKey].overdue++
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

export async function uploadActivityFile(
  employeeId: string,
  file: File,
  year: number,
  month: number,
): Promise<{ success: boolean; message: string }> {
  try {
    // In a real implementation, you would upload to Supabase Storage
    // For now, we'll simulate the file upload
    const fileData = {
      employee_id: employeeId,
      filename: file.name,
      file_path: `/uploads/${employeeId}/${year}/${month}/${file.name}`,
      file_size: file.size,
      mime_type: file.type,
    }

    const { data: activityFile, error: fileError } = await supabase
      .from("activity_files")
      .insert(fileData)
      .select()
      .single()

    if (fileError) {
      console.error("Error creating activity file:", fileError)
      return { success: false, message: "Failed to upload file" }
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
      console.error("Error updating monthly requirement:", updateError)
      return { success: false, message: "Failed to update requirement" }
    }

    return { success: true, message: "File uploaded successfully" }
  } catch (error) {
    console.error("Error in uploadActivityFile:", error)
    return { success: false, message: "Upload failed" }
  }
}

export async function downloadActivityFile(
  fileId: string,
): Promise<{ success: boolean; message: string; url?: string }> {
  try {
    // In a real implementation, you would get the file from Supabase Storage
    // For now, we'll simulate the download
    const { data, error } = await supabase.from("activity_files").select("*").eq("id", fileId).single()

    if (error || !data) {
      return { success: false, message: "File not found" }
    }

    // In a real app, you'd return the actual file URL from storage
    return {
      success: true,
      message: "File ready for download",
      url: data.file_path,
    }
  } catch (error) {
    console.error("Error in downloadActivityFile:", error)
    return { success: false, message: "Download failed" }
  }
}

export async function createMonthlyRequirements(year: number, month: number): Promise<number> {
  try {
    // Get all active teachers
    const { data: teachers, error: teachersError } = await supabase
      .from("employees")
      .select("id")
      .eq("category", "teacher")
      .eq("status", "active")

    if (teachersError) {
      console.error("Error fetching teachers:", teachersError)
      return 0
    }

    if (!teachers || teachers.length === 0) {
      return 0
    }

    // Check if requirements already exist for this month/year
    const { data: existing, error: existingError } = await supabase
      .from("monthly_file_requirements")
      .select("id")
      .eq("year", year)
      .eq("month", month)

    if (existingError) {
      console.error("Error checking existing requirements:", existingError)
      return 0
    }

    if (existing && existing.length > 0) {
      return 0 // Requirements already exist
    }

    // Create requirements for each teacher
    const requirements = teachers.map((teacher) => ({
      employee_id: teacher.id,
      year,
      month,
      due_date: new Date(year, month - 1, 15).toISOString().split("T")[0], // 15th of the month
      status: "pending" as const,
    }))

    const { data, error } = await supabase.from("monthly_file_requirements").insert(requirements).select()

    if (error) {
      console.error("Error creating monthly requirements:", error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error("Error in createMonthlyRequirements:", error)
    return 0
  }
}

export async function updateOverdueRequirements(): Promise<number> {
  try {
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("monthly_file_requirements")
      .update({ status: "overdue" })
      .eq("status", "pending")
      .lt("due_date", today)
      .select()

    if (error) {
      console.error("Error updating overdue requirements:", error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error("Error in updateOverdueRequirements:", error)
    return 0
  }
}
