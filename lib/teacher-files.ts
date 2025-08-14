import { supabase } from "./supabase"

export interface TeacherFile {
  id: string
  employee_id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  upload_date: string
  created_at: string
  updated_at: string
  employee?: {
    name: string
    employee_number: string
  }
}

export interface MonthlyFileRequirement {
  id: string
  employee_id: string
  year: number
  month: number
  due_date: string
  status: "pending" | "submitted" | "overdue"
  submitted_at?: string
  activity_file_id?: string
  created_at: string
  updated_at: string
  employee?: {
    name: string
    employee_number: string
  }
  activity_file?: TeacherFile
}

export async function getTeacherFiles(): Promise<TeacherFile[]> {
  try {
    const { data, error } = await supabase
      .from("activity_files")
      .select(`
        *,
        employee:employees(name, employee_number)
      `)
      .order("upload_date", { ascending: false })

    if (error) {
      console.error("Error fetching teacher files:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getTeacherFiles:", error)
    return []
  }
}

export async function getMonthlyRequirements(filters?: {
  year?: number
  month?: number
  status?: string
  employee_id?: string
}): Promise<MonthlyFileRequirement[]> {
  try {
    let query = supabase
      .from("monthly_file_requirements")
      .select(`
        *,
        employee:employees(name, employee_number),
        activity_file:activity_files(*)
      `)
      .order("due_date", { ascending: false })

    if (filters?.year) {
      query = query.eq("year", filters.year)
    }
    if (filters?.month) {
      query = query.eq("month", filters.month)
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }
    if (filters?.employee_id) {
      query = query.eq("employee_id", filters.employee_id)
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

export async function uploadTeacherFile(
  employeeId: string,
  file: File,
  requirementId?: string,
): Promise<TeacherFile | null> {
  try {
    // In a real implementation, you would upload to a storage service
    // For now, we'll simulate the file upload
    const fileData = {
      employee_id: employeeId,
      filename: file.name,
      file_path: `/uploads/${Date.now()}-${file.name}`,
      file_size: file.size,
      mime_type: file.type,
    }

    const { data, error } = await supabase.from("activity_files").insert(fileData).select().single()

    if (error) {
      console.error("Error uploading teacher file:", error)
      return null
    }

    // If this is for a specific requirement, update it
    if (requirementId && data) {
      await supabase
        .from("monthly_file_requirements")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          activity_file_id: data.id,
        })
        .eq("id", requirementId)
    }

    return data
  } catch (error) {
    console.error("Error in uploadTeacherFile:", error)
    return null
  }
}

export async function deleteTeacherFile(fileId: string): Promise<boolean> {
  try {
    // First, update any requirements that reference this file
    await supabase
      .from("monthly_file_requirements")
      .update({
        status: "pending",
        submitted_at: null,
        activity_file_id: null,
      })
      .eq("activity_file_id", fileId)

    // Then delete the file record
    const { error } = await supabase.from("activity_files").delete().eq("id", fileId)

    if (error) {
      console.error("Error deleting teacher file:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteTeacherFile:", error)
    return false
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
