import { supabase } from "./supabase"
import type { ActivityFile } from "./supabase"

export async function getActivityFiles(): Promise<ActivityFile[]> {
  try {
    const { data, error } = await supabase
      .from("activity_files")
      .select(`
        *,
        employees!inner(
          *,
          users!inner(*)
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching activity files:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching activity files:", error)
    return []
  }
}

export async function uploadActivityFile(
  employeeId: string,
  fileName: string,
  filePath: string,
  fileSize: number,
  fileType: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("activity_files").insert({
      employee_id: employeeId,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      file_type: fileType,
      status: "pending",
    })

    if (error) {
      console.error("Error uploading activity file:", error)
      return false
    }

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: employeeId,
      action: "UPLOAD_FILE",
      table_name: "activity_files",
      new_values: { fileName, fileSize, fileType },
    })

    return true
  } catch (error) {
    console.error("Error uploading activity file:", error)
    return false
  }
}

export async function updateFileStatus(
  fileId: string,
  status: "approved" | "rejected",
  reviewedBy: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("activity_files")
      .update({
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", fileId)

    if (error) {
      console.error("Error updating file status:", error)
      return false
    }

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: reviewedBy,
      action: "REVIEW_FILE",
      table_name: "activity_files",
      record_id: fileId,
      new_values: { status },
    })

    return true
  } catch (error) {
    console.error("Error updating file status:", error)
    return false
  }
}

export async function deleteActivityFile(fileId: string, deletedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("activity_files").delete().eq("id", fileId)

    if (error) {
      console.error("Error deleting activity file:", error)
      return false
    }

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: deletedBy,
      action: "DELETE_FILE",
      table_name: "activity_files",
      record_id: fileId,
    })

    return true
  } catch (error) {
    console.error("Error deleting activity file:", error)
    return false
  }
}

export async function getActivityFileStats(): Promise<{
  totalFiles: number
  pendingFiles: number
  approvedFiles: number
  rejectedFiles: number
}> {
  try {
    const { data: files } = await supabase.from("activity_files").select("status")

    if (!files) {
      return { totalFiles: 0, pendingFiles: 0, approvedFiles: 0, rejectedFiles: 0 }
    }

    const totalFiles = files.length
    const pendingFiles = files.filter((f) => f.status === "pending").length
    const approvedFiles = files.filter((f) => f.status === "approved").length
    const rejectedFiles = files.filter((f) => f.status === "rejected").length

    return {
      totalFiles,
      pendingFiles,
      approvedFiles,
      rejectedFiles,
    }
  } catch (error) {
    console.error("Error fetching activity file stats:", error)
    return { totalFiles: 0, pendingFiles: 0, approvedFiles: 0, rejectedFiles: 0 }
  }
}
