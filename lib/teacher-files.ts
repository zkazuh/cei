import { supabase } from "./supabase"

export interface TeacherFile {
  id: string
  teacher_id: string
  requirement_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  status: "pending" | "submitted" | "approved" | "rejected"
  submitted_at?: string
  reviewed_at?: string
  reviewed_by?: string
  comments?: string
  created_at: string
  updated_at: string
}

export interface FileRequirement {
  id: string
  title: string
  description: string
  due_date?: string
  is_mandatory: boolean
  file_types: string[]
  max_file_size: number
  status: "active" | "inactive"
  created_by: string
  created_at: string
  updated_at: string
}

export interface TeacherFileStats {
  total: number
  pending: number
  submitted: number
  approved: number
  rejected: number
  overdue: number
}

export async function getTeacherFiles(filters?: {
  teacherId?: string
  requirementId?: string
  status?: string
  search?: string
}): Promise<TeacherFile[]> {
  try {
    let query = supabase.from("teacher_files").select("*").order("created_at", { ascending: false })

    if (filters?.teacherId) {
      query = query.eq("teacher_id", filters.teacherId)
    }

    if (filters?.requirementId) {
      query = query.eq("requirement_id", filters.requirementId)
    }

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.search) {
      query = query.or(`file_name.ilike.%${filters.search}%,comments.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

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

export async function getFileRequirements(filters?: {
  status?: string
  search?: string
}): Promise<FileRequirement[]> {
  try {
    let query = supabase.from("file_requirements").select("*").order("created_at", { ascending: false })

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching file requirements:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getFileRequirements:", error)
    return []
  }
}

export async function getTeacherFileStats(): Promise<TeacherFileStats> {
  try {
    const { data, error } = await supabase.from("teacher_files").select("status, submitted_at")

    if (error) {
      console.error("Error fetching teacher file stats:", error)
      return {
        total: 0,
        pending: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        overdue: 0,
      }
    }

    if (!data || data.length === 0) {
      return {
        total: 0,
        pending: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
        overdue: 0,
      }
    }

    const now = new Date()
    const stats = {
      total: data.length,
      pending: data.filter((file) => file.status === "pending").length,
      submitted: data.filter((file) => file.status === "submitted").length,
      approved: data.filter((file) => file.status === "approved").length,
      rejected: data.filter((file) => file.status === "rejected").length,
      overdue: 0,
    }

    // Calculate overdue files (pending files past their due date)
    // This would require joining with file_requirements table to get due_date
    // For now, we'll use a simple heuristic
    stats.overdue = data.filter((file) => {
      if (file.status !== "pending") return false
      // If submitted_at is null and created more than 30 days ago, consider overdue
      const createdAt = new Date(file.submitted_at || "1970-01-01")
      const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24)
      return daysDiff > 30
    }).length

    return stats
  } catch (error) {
    console.error("Error in getTeacherFileStats:", error)
    return {
      total: 0,
      pending: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      overdue: 0,
    }
  }
}

export async function createFileRequirement(
  requirement: Omit<FileRequirement, "id" | "created_at" | "updated_at">,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("file_requirements").insert(requirement)

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

export async function uploadTeacherFile(file: Omit<TeacherFile, "id" | "created_at" | "updated_at">): Promise<boolean> {
  try {
    const { error } = await supabase.from("teacher_files").insert(file)

    if (error) {
      console.error("Error uploading teacher file:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in uploadTeacherFile:", error)
    return false
  }
}

export async function updateTeacherFileStatus(
  fileId: string,
  status: "pending" | "submitted" | "approved" | "rejected",
  reviewedBy?: string,
  comments?: string,
): Promise<boolean> {
  try {
    const updates: Partial<TeacherFile> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status !== "pending") {
      updates.reviewed_at = new Date().toISOString()
      updates.reviewed_by = reviewedBy
      updates.comments = comments
    }

    if (status === "submitted") {
      updates.submitted_at = new Date().toISOString()
    }

    const { error } = await supabase.from("teacher_files").update(updates).eq("id", fileId)

    if (error) {
      console.error("Error updating teacher file status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateTeacherFileStatus:", error)
    return false
  }
}

export async function deleteTeacherFile(fileId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("teacher_files").delete().eq("id", fileId)

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

export async function deleteFileRequirement(requirementId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("file_requirements").delete().eq("id", requirementId)

    if (error) {
      console.error("Error deleting file requirement:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteFileRequirement:", error)
    return false
  }
}

export async function getTeacherFileById(fileId: string): Promise<TeacherFile | null> {
  try {
    const { data, error } = await supabase.from("teacher_files").select("*").eq("id", fileId).single()

    if (error) {
      console.error("Error fetching teacher file by id:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getTeacherFileById:", error)
    return null
  }
}

export async function getFileRequirementById(requirementId: string): Promise<FileRequirement | null> {
  try {
    const { data, error } = await supabase.from("file_requirements").select("*").eq("id", requirementId).single()

    if (error) {
      console.error("Error fetching file requirement by id:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getFileRequirementById:", error)
    return null
  }
}

export async function updateFileRequirement(
  requirementId: string,
  updates: Partial<FileRequirement>,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("file_requirements")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requirementId)

    if (error) {
      console.error("Error updating file requirement:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateFileRequirement:", error)
    return false
  }
}
