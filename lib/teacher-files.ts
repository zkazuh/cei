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

export async function getMonthlyFileRequirements(filters?: {
  year?: number
  month?: number
  status?: string
  teacherId?: string
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

    if (filters?.year) {
      query = query.eq("year", filters.year)
    }
    if (filters?.month) {
      query = query.eq("month", filters.month)
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }
    if (filters?.teacherId && filters.teacherId !== "all") {
      query = query.eq("employee_id", filters.teacherId)
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

export async function uploadActivityFile(
  employeeId: string,
  file: File,
  year: number,
  month: number,
): Promise<boolean> {
  try {
    // In a real implementation, you would upload to Supabase Storage
    // For now, we'll simulate the file upload
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
      .eq("employee_id", employeeId)
      .eq("year", year)
      .eq("month", month)

    if (updateError) {
      console.error("Error updating monthly requirement:", updateError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in uploadActivityFile:", error)
    return false
  }
}

export async function downloadActivityFile(fileId: string): Promise<Blob | null> {
  try {
    // In a real implementation, you would download from Supabase Storage
    // For now, we'll generate a mock PDF file
    const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Monthly Activity Report) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`

    return new Blob([mockPdfContent], { type: "application/pdf" })
  } catch (error) {
    console.error("Error in downloadActivityFile:", error)
    return null
  }
}

export async function getFileStats(): Promise<{
  total: number
  pending: number
  submitted: number
  overdue: number
}> {
  try {
    const { data, error } = await supabase.from("monthly_file_requirements").select("status")

    if (error) {
      console.error("Error fetching file stats:", error)
      return { total: 0, pending: 0, submitted: 0, overdue: 0 }
    }

    const stats = {
      total: data?.length || 0,
      pending: 0,
      submitted: 0,
      overdue: 0,
    }

    data?.forEach((req) => {
      stats[req.status as keyof typeof stats]++
    })

    return stats
  } catch (error) {
    console.error("Error in getFileStats:", error)
    return { total: 0, pending: 0, submitted: 0, overdue: 0 }
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
