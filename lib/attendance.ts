import { supabase } from "./supabase"
import type { Attendance } from "./supabase"

export async function getAttendanceForDate(date: string): Promise<Attendance[]> {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        employees!inner(
          *,
          users!inner(*)
        ),
        attendance_justifications(*)
      `)
      .eq("date", date)
      .order("period", { ascending: true })
      .order("name", { ascending: true, foreignTable: "employees.users" })

    if (error) {
      console.error("Error fetching attendance for date:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching attendance for date:", error)
    return []
  }
}

export async function getTodayAttendance(): Promise<Attendance[]> {
  const today = new Date().toISOString().split("T")[0]
  return getAttendanceForDate(today)
}

export async function updateAttendanceStatus(
  employeeId: string,
  status: "present" | "absent",
  markedBy: string,
  date?: string,
  period: "morning" | "afternoon" = "morning",
): Promise<boolean> {
  try {
    const attendanceDate = date || new Date().toISOString().split("T")[0]

    const { error } = await supabase.from("attendance").upsert(
      {
        employee_id: employeeId,
        date: attendanceDate,
        period,
        status,
        marked_by: markedBy,
      },
      {
        onConflict: "employee_id,date,period",
      },
    )

    if (error) {
      console.error("Error updating attendance:", error)
      return false
    }

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: markedBy,
      action: "UPDATE_ATTENDANCE",
      table_name: "attendance",
      record_id: employeeId,
      new_values: { status, date: attendanceDate, period },
    })

    return true
  } catch (error) {
    console.error("Error updating attendance:", error)
    return false
  }
}

export async function addAttendanceJustification(
  attendanceId: string,
  justificationType: "medical" | "justified" | "banked_hours" | "other" | "course" | "recess" | "meeting",
  justificationText: string,
  createdBy: string,
): Promise<boolean> {
  try {
    // First, delete any existing justification for this attendance
    await supabase.from("attendance_justifications").delete().eq("attendance_id", attendanceId)

    // Insert the new justification
    const { error } = await supabase.from("attendance_justifications").insert({
      attendance_id: attendanceId,
      justification_type: justificationType,
      justification_text: justificationText,
      created_by: createdBy,
    })

    if (error) {
      console.error("Error adding justification:", error)
      return false
    }

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: createdBy,
      action: "ADD_JUSTIFICATION",
      table_name: "attendance_justifications",
      record_id: attendanceId,
      new_values: { justificationType, justificationText },
    })

    return true
  } catch (error) {
    console.error("Error adding justification:", error)
    return false
  }
}

export async function getAttendanceStats(): Promise<{
  totalEmployees: number
  presentToday: number
  absentToday: number
  attendanceRate: number
}> {
  try {
    const today = new Date().toISOString().split("T")[0]

    // Get total active employees
    const { count: totalEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    // Get today's attendance (count unique employees who are present in at least one period)
    const { data: attendance } = await supabase.from("attendance").select("employee_id, status").eq("date", today)

    if (!attendance) {
      return { totalEmployees: totalEmployees || 0, presentToday: 0, absentToday: 0, attendanceRate: 0 }
    }

    // Group by employee and check if they have at least one present period
    const employeeAttendance = new Map<string, boolean>()

    attendance.forEach((record) => {
      const currentStatus = employeeAttendance.get(record.employee_id) || false
      employeeAttendance.set(record.employee_id, currentStatus || record.status === "present")
    })

    const presentToday = Array.from(employeeAttendance.values()).filter(Boolean).length
    const absentToday = (totalEmployees || 0) - presentToday
    const attendanceRate = totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0

    return {
      totalEmployees: totalEmployees || 0,
      presentToday,
      absentToday,
      attendanceRate,
    }
  } catch (error) {
    console.error("Error fetching attendance stats:", error)
    return {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      attendanceRate: 0,
    }
  }
}

export async function getAttendanceStatsForDate(date: string): Promise<{
  totalEmployees: number
  presentCount: number
  absentCount: number
  attendanceRate: number
}> {
  try {
    // Get total active employees
    const { count: totalEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    // Get attendance for the specific date
    const { data: attendance } = await supabase.from("attendance").select("employee_id, status").eq("date", date)

    if (!attendance) {
      return { totalEmployees: totalEmployees || 0, presentCount: 0, absentCount: 0, attendanceRate: 0 }
    }

    // Group by employee and check if they have at least one present period
    const employeeAttendance = new Map<string, boolean>()

    attendance.forEach((record) => {
      const currentStatus = employeeAttendance.get(record.employee_id) || false
      employeeAttendance.set(record.employee_id, currentStatus || record.status === "present")
    })

    const presentCount = Array.from(employeeAttendance.values()).filter(Boolean).length
    const absentCount = (totalEmployees || 0) - presentCount
    const attendanceRate = totalEmployees ? Math.round((presentCount / totalEmployees) * 100) : 0

    return {
      totalEmployees: totalEmployees || 0,
      presentCount,
      absentCount,
      attendanceRate,
    }
  } catch (error) {
    console.error("Error fetching attendance stats for date:", error)
    return {
      totalEmployees: 0,
      presentCount: 0,
      absentCount: 0,
      attendanceRate: 0,
    }
  }
}
