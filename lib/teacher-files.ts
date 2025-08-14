import { supabase } from "./supabase"

export interface TeacherFile {
  id: string
  teacher_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  requirement_id?: string
  status: "pending" | "submitted" | "approved" | "rejected"
  uploaded_at: string
  updated_at: string
  notes?: string
}

export interface FileRequirement {
  id: string
  name: string
  description: string
  required: boolean
  due_date?: string
  file_types: string[]
  max_file_size: number
  created_at: string
  updated_at: string
}

export interface TeacherFileStats {
  totalFiles: number
  pendingFiles: number
  submittedFiles: number
  approvedFiles: number
  rejectedFiles: number
  totalRequirements: number
  completedRequirements: number
}

export async function getTeacherFiles(teacherId?: string): Promise<TeacherFile[]> {
  try {
    let query = supabase
      .from("activity_files")
      .select(`
        id,
        employee_id,
        file_name,
        file_type,
        file_size,
        file_url,
        status,
        uploaded_at,
        updated_at,
        notes,
        employees (
          id,
          name,
          employee_number,
          department
        )
      `)
      .order("uploaded_at", { ascending: false })

    if (teacherId) {
      query = query.eq("employee_id", teacherId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching teacher files:", error)
      return []
    }

    // Transform the data to match TeacherFile interface
    return (data || []).map((file) => ({
      id: file.id,
      teacher_id: file.employee_id,
      file_name: file.file_name,
      file_type: file.file_type,
      file_size: file.file_size || 0,
      file_url: file.file_url || "",
      status: file.status || "pending",
      uploaded_at: file.uploaded_at,
      updated_at: file.updated_at,
      notes: file.notes,
    }))
  } catch (error) {
    console.error("Error in getTeacherFiles:", error)
    return []
  }
}

export async function getFileRequirements(): Promise<FileRequirement[]> {
  try {
    // Since we don't have a file_requirements table, return some default requirements
    const defaultRequirements: FileRequirement[] = [
      {
        id: "1",
        name: "Teaching Certificate",
        description: "Valid teaching certificate or license",
        required: true,
        file_types: ["pdf", "jpg", "png"],
        max_file_size: 5 * 1024 * 1024, // 5MB
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Resume/CV",
        description: "Current resume or curriculum vitae",
        required: true,
        file_types: ["pdf", "doc", "docx"],
        max_file_size: 2 * 1024 * 1024, // 2MB
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "ID Copy",
        description: "Copy of government-issued identification",
        required: true,
        file_types: ["pdf", "jpg", "png"],
        max_file_size: 3 * 1024 * 1024, // 3MB
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Background Check",
        description: "Criminal background check certificate",
        required: false,
        file_types: ["pdf"],
        max_file_size: 5 * 1024 * 1024, // 5MB
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    return defaultRequirements
  } catch (error) {
    console.error("Error in getFileRequirements:", error)
    return []
  }
}

export async function uploadFile(teacherId: string, file: File, requirementId?: string): Promise<TeacherFile | null> {
  try {
    // In a real implementation, you would upload to a storage service
    // For demo purposes, we'll create a mock file URL
    const mockFileUrl = `/uploads/${Date.now()}_${file.name}`

    const fileData = {
      employee_id: teacherId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: mockFileUrl,
      status: "submitted",
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: requirementId ? `Uploaded for requirement ${requirementId}` : undefined,
    }

    const { data, error } = await supabase.from("activity_files").insert(fileData).select().single()

    if (error) {
      console.error("Error uploading file:", error)
      return null
    }

    // Transform to TeacherFile format
    return {
      id: data.id,
      teacher_id: data.employee_id,
      file_name: data.file_name,
      file_type: data.file_type,
      file_size: data.file_size || 0,
      file_url: data.file_url || "",
      requirement_id: requirementId,
      status: data.status || "pending",
      uploaded_at: data.uploaded_at,
      updated_at: data.updated_at,
      notes: data.notes,
    }
  } catch (error) {
    console.error("Error in uploadFile:", error)
    return null
  }
}

export async function updateFileStatus(
  fileId: string,
  status: "pending" | "submitted" | "approved" | "rejected",
  notes?: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("activity_files")
      .update({
        status,
        notes,
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

export async function getTeacherFileStats(teacherId?: string): Promise<TeacherFileStats> {
  try {
    let query = supabase.from("activity_files").select("status")

    if (teacherId) {
      query = query.eq("employee_id", teacherId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching teacher file stats:", error)
      return {
        totalFiles: 0,
        pendingFiles: 0,
        submittedFiles: 0,
        approvedFiles: 0,
        rejectedFiles: 0,
        totalRequirements: 0,
        completedRequirements: 0,
      }
    }

    const files = data || []
    const requirements = await getFileRequirements()

    return {
      totalFiles: files.length,
      pendingFiles: files.filter((f) => f.status === "pending").length,
      submittedFiles: files.filter((f) => f.status === "submitted").length,
      approvedFiles: files.filter((f) => f.status === "approved").length,
      rejectedFiles: files.filter((f) => f.status === "rejected").length,
      totalRequirements: requirements.length,
      completedRequirements: requirements.filter((r) => r.required).length,
    }
  } catch (error) {
    console.error("Error in getTeacherFileStats:", error)
    return {
      totalFiles: 0,
      pendingFiles: 0,
      submittedFiles: 0,
      approvedFiles: 0,
      rejectedFiles: 0,
      totalRequirements: 0,
      completedRequirements: 0,
    }
  }
}

export async function downloadFile(fileId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("activity_files")
      .select("file_url, file_name")
      .eq("id", fileId)
      .single()

    if (error) {
      console.error("Error getting file download URL:", error)
      return null
    }

    // In a real implementation, you would return the actual file URL
    // For demo purposes, return a mock URL
    return data.file_url || `/downloads/${data.file_name}`
  } catch (error) {
    console.error("Error in downloadFile:", error)
    return null
  }
}

export async function createFileRequirement(
  requirement: Omit<FileRequirement, "id" | "created_at" | "updated_at">,
): Promise<FileRequirement | null> {
  try {
    // In a real implementation, you would save to a file_requirements table
    // For demo purposes, return a mock requirement
    const newRequirement: FileRequirement = {
      id: Date.now().toString(),
      ...requirement,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return newRequirement
  } catch (error) {
    console.error("Error in createFileRequirement:", error)
    return null
  }
}

export async function updateFileRequirement(
  requirementId: string,
  updates: Partial<Omit<FileRequirement, "id" | "created_at" | "updated_at">>,
): Promise<FileRequirement | null> {
  try {
    // In a real implementation, you would update the file_requirements table
    // For demo purposes, return a mock updated requirement
    const requirements = await getFileRequirements()
    const existing = requirements.find((r) => r.id === requirementId)

    if (!existing) {
      return null
    }

    const updated: FileRequirement = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    return updated
  } catch (error) {
    console.error("Error in updateFileRequirement:", error)
    return null
  }
}

export async function deleteFileRequirement(requirementId: string): Promise<boolean> {
  try {
    // In a real implementation, you would delete from the file_requirements table
    // For demo purposes, return true
    return true
  } catch (error) {
    console.error("Error in deleteFileRequirement:", error)
    return false
  }
}
