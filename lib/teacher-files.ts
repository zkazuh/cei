import { supabase } from "./supabase"
import type { MonthlyFileRequirement } from "./supabase"

export interface TeacherFileSubmission {
  requirementId: string
  fileId: string
}

export async function getMonthlyRequirements(year?: number, month?: number): Promise<MonthlyFileRequirement[]> {
  try {
    let query = supabase
      .from("monthly_file_requirements")
      .select(`
        *,
        activity_files(*)
      `)
      .order("due_date", { ascending: true })

    if (year && month) {
      query = query.eq("year", year).eq("month", month)
    }

    const { data: requirements, error } = await query

    if (error) {
      console.error("Error fetching monthly requirements:", error)
      return []
    }

    if (!requirements) return []

    const employeeIds = [...new Set(requirements.map((req) => req.employee_id))]

    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("*")
      .in("id", employeeIds)

    if (employeesError) {
      console.error("Error fetching employees:", employeesError)
      return requirements
    }

    const userIds = [...new Set(employees?.map((emp) => emp.user_id).filter(Boolean) || [])]

    const { data: users, error: usersError } = await supabase.from("users").select("*").in("id", userIds)

    if (usersError) {
      console.error("Error fetching users:", usersError)
    }

    const enrichedRequirements = requirements.map((req) => {
      const employee = employees?.find((emp) => emp.id === req.employee_id)
      const user = employee ? users?.find((u) => u.id === employee.user_id) : null

      return {
        ...req,
        employees: employee
          ? {
              ...employee,
              users: user,
            }
          : null,
      }
    })

    enrichedRequirements.sort((a, b) => {
      const nameA = a.employees?.users?.name || a.employees?.name || ""
      const nameB = b.employees?.users?.name || b.employees?.name || ""
      return nameA.localeCompare(nameB)
    })

    return enrichedRequirements
  } catch (error) {
    console.error("Error fetching monthly requirements:", error)
    return []
  }
}

export async function getCurrentMonthRequirements(): Promise<MonthlyFileRequirement[]> {
  const now = new Date()
  return getMonthlyRequirements(now.getFullYear(), now.getMonth() + 1)
}

export async function submitTeacherFile(requirementId: string, fileId: string, submittedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("monthly_file_requirements")
      .update({
        status: "submitted",
        submitted_file_id: fileId,
      })
      .eq("id", requirementId)

    if (error) {
      console.error("Error submitting teacher file:", error)
      return false
    }

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: submittedBy,
      action: "SUBMIT_TEACHER_FILE",
      table_name: "monthly_file_requirements",
      record_id: requirementId,
      new_values: { fileId, status: "submitted" },
    })

    return true
  } catch (error) {
    console.error("Error submitting teacher file:", error)
    return false
  }
}

export async function updateOverdueRequirements(): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0]

    await supabase
      .from("monthly_file_requirements")
      .update({ status: "overdue" })
      .eq("status", "pending")
      .lt("due_date", today)
  } catch (error) {
    console.error("Error updating overdue requirements:", error)
  }
}

export async function getTeacherFileStats(): Promise<{
  totalRequirements: number
  pendingRequirements: number
  submittedRequirements: number
  overdueRequirements: number
  currentMonthPending: number
  currentMonthOverdue: number
}> {
  try {
    const { data: requirements } = await supabase
      .from("monthly_file_requirements")
      .select("status, year, month, due_date")

    if (!requirements) {
      return {
        totalRequirements: 0,
        pendingRequirements: 0,
        submittedRequirements: 0,
        overdueRequirements: 0,
        currentMonthPending: 0,
        currentMonthOverdue: 0,
      }
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const totalRequirements = requirements.length
    const pendingRequirements = requirements.filter((r) => r.status === "pending").length
    const submittedRequirements = requirements.filter((r) => r.status === "submitted").length
    const overdueRequirements = requirements.filter((r) => r.status === "overdue").length

    const currentMonthReqs = requirements.filter((r) => r.year === currentYear && r.month === currentMonth)
    const currentMonthPending = currentMonthReqs.filter((r) => r.status === "pending").length
    const currentMonthOverdue = currentMonthReqs.filter((r) => r.status === "overdue").length

    return {
      totalRequirements,
      pendingRequirements,
      submittedRequirements,
      overdueRequirements,
      currentMonthPending,
      currentMonthOverdue,
    }
  } catch (error) {
    console.error("Error fetching teacher file stats:", error)
    return {
      totalRequirements: 0,
      pendingRequirements: 0,
      submittedRequirements: 0,
      overdueRequirements: 0,
      currentMonthPending: 0,
      currentMonthOverdue: 0,
    }
  }
}

export async function createMonthlyRequirementsForAllTeachers(year: number, month: number): Promise<boolean> {
  try {
    // Get all active teachers
    const { data: teachers, error: teachersError } = await supabase
      .from("employees")
      .select("id")
      .eq("category", "teacher")
      .eq("status", "active") // Fixed column name from is_active to status

    if (teachersError || !teachers) {
      console.error("Error fetching teachers:", teachersError)
      return false
    }

    // Create requirements for each teacher
    const dueDate = new Date(year, month - 1, 10).toISOString().split("T")[0]
    const requirements = teachers.map((teacher) => ({
      employee_id: teacher.id,
      year,
      month,
      due_date: dueDate,
      status: "pending" as const,
    }))

    const { error: insertError } = await supabase.from("monthly_file_requirements").insert(requirements)

    if (insertError) {
      console.error("Error creating monthly requirements:", insertError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error creating monthly requirements:", error)
    return false
  }
}
