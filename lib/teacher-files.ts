import { supabase } from "./supabase"
import type { ActivityFile, Employee } from "./supabase"

export async function getTeacherFiles(): Promise<(ActivityFile & { employees: Employee })[]> {
  try {
    const { data, error } = await supabase
      .from("activity_files")
      .select(`
        *,
        employees (*)
      `)
      .order("due_date", { ascending: true })

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

export async function getFileStats(): Promise<{
  total: number
  pending: number
  submitted: number
  overdue: number
}> {
  try {
    const { data, error } = await supabase.from("activity_files").select("status, due_date")

    if (error) {
      console.error("Error fetching file stats:", error)
      return { total: 0, pending: 0, submitted: 0, overdue: 0 }
    }

    const now = new Date()
    const stats = {
      total: data?.length || 0,
      pending: 0,
      submitted: 0,
      overdue: 0,
    }

    data?.forEach((file) => {
      if (file.status === "submitted") {
        stats.submitted++
      } else if (file.status === "pending") {
        if (file.due_date && new Date(file.due_date) < now) {
          stats.overdue++
        } else {
          stats.pending++
        }
      }
    })

    return stats
  } catch (error) {
    console.error("Error in getFileStats:", error)
    return { total: 0, pending: 0, submitted: 0, overdue: 0 }
  }
}

export async function updateFileStatus(fileId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("activity_files")
      .update({
        status,
        submitted_at: status === "submitted" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)

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

export async function createFileRequirement(
  requirement: Omit<ActivityFile, "id" | "created_at" | "updated_at">,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("activity_files").insert(requirement)

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

export async function uploadFile(
  file: File,
  employeeId: string,
  requirementType: string,
  month: number,
  year: number,
): Promise<string | null> {
  try {
    // In a real implementation, you would upload to Supabase Storage or another service
    // For demo purposes, we'll simulate file upload
    const fileName = `${employeeId}_${requirementType}_${month}_${year}_${file.name}`
    const filePath = `uploads/${fileName}`

    // Simulate file upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return filePath
  } catch (error) {
    console.error("Error uploading file:", error)
    return null
  }
}

export async function downloadFile(filePath: string): Promise<Blob | null> {
  try {
    // In a real implementation, you would download from Supabase Storage
    // For demo purposes, we'll create a dummy file
    const content = `Demo file content for ${filePath}`
    return new Blob([content], { type: "text/plain" })
  } catch (error) {
    console.error("Error downloading file:", error)
    return null
  }
}
