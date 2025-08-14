import { supabase } from "./supabase"
import type { ActivityFile, Employee } from "./supabase"

export interface TeacherFileWithEmployee extends ActivityFile {
  employees: Employee
}

export interface FileStats {
  total: number
  pending: number
  submitted: number
  overdue: number
}

export interface FileRequirement {
  employee_id: string
  file_name: string
  file_path?: string
  file_size?: number
  file_type?: string
  requirement_type: string
  month: number
  year: number
  due_date: string
  status: "pending" | "submitted"
  submitted_at?: string
}

export async function getTeacherFiles(): Promise<TeacherFileWithEmployee[]> {
  try {
    const { data, error } = await supabase
      .from("activity_files")
      .select(`
        *,
        employees!inner (
          id,
          name,
          employee_number,
          department,
          position,
          category
        )
      `)
      .eq("employees.category", "teacher")
      .order("created_at", { ascending: false })

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

export async function getFileStats(): Promise<FileStats> {
  try {
    const { data, error } = await supabase
      .from("activity_files")
      .select(`
        status,
        due_date,
        employees!inner (category)
      `)
      .eq("employees.category", "teacher")

    if (error) {
      console.error("Error fetching file stats:", error)
      return { total: 0, pending: 0, submitted: 0, overdue: 0 }
    }

    const now = new Date()
    const stats = {
      total: data?.length || 0,
      pending: data?.filter((file) => file.status === "pending").length || 0,
      submitted: data?.filter((file) => file.status === "submitted").length || 0,
      overdue:
        data?.filter((file) => file.status === "pending" && file.due_date && new Date(file.due_date) < now).length || 0,
    }

    return stats
  } catch (error) {
    console.error("Error in getFileStats:", error)
    return { total: 0, pending: 0, submitted: 0, overdue: 0 }
  }
}

export async function updateFileStatus(fileId: string, status: string): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "submitted") {
      updateData.submitted_at = new Date().toISOString()
    }

    const { error } = await supabase.from("activity_files").update(updateData).eq("id", fileId)

    if (error) {
      console.error("Error updating file status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateFileStatus:", error)
    return false
  }
}

export async function uploadFile(
  file: File,
  employeeId: string,
  requirementType: string,
  month: number,
  year: number,
): Promise<string | null> {
  try {
    // For demo purposes, we'll simulate file upload
    // In a real implementation, you would upload to Supabase Storage or another service
    const fileName = `${employeeId}_${requirementType}_${month}_${year}_${file.name}`
    const filePath = `teacher-files/${fileName}`

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Return simulated file path
    return filePath
  } catch (error) {
    console.error("Error uploading file:", error)
    return null
  }
}

export async function downloadFile(filePath: string): Promise<Blob | null> {
  try {
    // For demo purposes, we'll create a dummy file
    // In a real implementation, you would download from Supabase Storage
    const content = `This is a demo file for: ${filePath}\nGenerated at: ${new Date().toISOString()}`
    const blob = new Blob([content], { type: "text/plain" })

    return blob
  } catch (error) {
    console.error("Error downloading file:", error)
    return null
  }
}

export async function createFileRequirement(requirement: FileRequirement): Promise<boolean> {
  try {
    const { error } = await supabase.from("activity_files").insert({
      employee_id: requirement.employee_id,
      file_name: requirement.file_name,
      file_path: requirement.file_path,
      file_size: requirement.file_size,
      file_type: requirement.file_type,
      requirement_type: requirement.requirement_type,
      month: requirement.month,
      year: requirement.year,
      due_date: requirement.due_date,
      status: requirement.status,
      submitted_at: requirement.submitted_at,
    })

    if (error) {
      console.error("Error creating file requirement:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in createFileRequirement:", error)
    return false
  }
}

export async function getTeacherFilesByEmployee(employeeId: string): Promise<TeacherFileWithEmployee[]> {
  try {
    const { data, error } = await supabase
      .from("activity_files")
      .select(`
        *,
        employees!inner (
          id,
          name,
          employee_number,
          department,
          position,
          category
        )
      `)
      .eq("employee_id", employeeId)
      .eq("employees.category", "teacher")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching teacher files by employee:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getTeacherFilesByEmployee:", error)
    return []
  }
}

export async function deleteFile(fileId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("activity_files").delete().eq("id", fileId)

    if (error) {
      console.error("Error deleting file:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteFile:", error)
    return false
  }
}

export async function bulkCreateFileRequirements(requirements: FileRequirement[]): Promise<boolean> {
  try {
    const { error } = await supabase.from("activity_files").insert(
      requirements.map((req) => ({
        employee_id: req.employee_id,
        file_name: req.file_name,
        file_path: req.file_path,
        file_size: req.file_size,
        file_type: req.file_type,
        requirement_type: req.requirement_type,
        month: req.month,
        year: req.year,
        due_date: req.due_date,
        status: req.status,
        submitted_at: req.submitted_at,
      })),
    )

    if (error) {
      console.error("Error creating bulk file requirements:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in bulkCreateFileRequirements:", error)
    return false
  }
}
