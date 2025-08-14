import { supabase } from "./supabase"
import type { MonthlyFileRequirement, ActivityFile, Employee } from "./supabase"

export interface MonthlyFileRequirementWithDetails extends MonthlyFileRequirement {
  employee: Employee
  activity_file: ActivityFile | null
}

export async function getMonthlyFileRequirements(
  year?: number,
  month?: number,
  status?: string,
  employeeId?: string,
): Promise<MonthlyFileRequirementWithDetails[]> {
  try {
    let query = supabase
      .from("monthly_file_requirements")
      .select(`
        *,
        employee:employees(*),
        activity_file:activity_files(*)
      `)
      .order("due_date", { ascending: false })

    if (year) {
      query = query.eq("year", year)
    }

    if (month) {
      query = query.eq("month", month)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (employeeId) {
      query = query.eq("employee_id", employeeId)
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

export async function createMonthlyRequirements(year: number, month: number): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("create_monthly_requirements_for_teachers", {
      target_year: year,
      target_month: month,
    })

    if (error) {
      console.error("Error creating monthly requirements:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in createMonthlyRequirements:", error)
    return false
  }
}

export async function updateOverdueRequirements(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("update_overdue_requirements")

    if (error) {
      console.error("Error updating overdue requirements:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateOverdueRequirements:", error)
    return false
  }
}

export async function uploadTeacherFile(requirementId: string, file: File, employeeId: string): Promise<boolean> {
  try {
    // First, upload the file to Supabase Storage (or handle file storage)
    const fileName = `${Date.now()}_${file.name}`
    const filePath = `teacher-files/${employeeId}/${fileName}`

    // For demo purposes, we'll simulate file upload
    // In production, you would upload to Supabase Storage or another service

    // Create activity file record
    const { data: activityFile, error: fileError } = await supabase
      .from("activity_files")
      .insert({
        employee_id: employeeId,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        upload_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (fileError) {
      console.error("Error creating activity file:", fileError)
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
      .eq("id", requirementId)

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

export async function downloadTeacherFile(fileId: string): Promise<void> {
  try {
    // Get file information
    const { data: file, error } = await supabase.from("activity_files").select("*").eq("id", fileId).single()

    if (error || !file) {
      throw new Error("File not found")
    }

    // For demo purposes, we'll create a mock download
    // In production, you would download from Supabase Storage or another service
    const mockFileContent = `Mock file content for: ${file.filename}\nUploaded on: ${file.upload_date}\nFile size: ${file.file_size} bytes`

    const blob = new Blob([mockFileContent], { type: file.mime_type || "text/plain" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error downloading file:", error)
    throw error
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "📄"
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝"
  if (mimeType.includes("image")) return "🖼️"
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊"
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📋"
  return "📎"
}
