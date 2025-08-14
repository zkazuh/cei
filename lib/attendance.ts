import { supabase } from "./supabase"
import type { Attendance } from "./supabase"

export async function getAttendanceForDate(date: string): Promise<Attendance[]> {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        employees (*),
        attendance_justifications (*)
      `)
      .eq("date", date)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching attendance:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAttendanceForDate:", error)
    return []
  }
}

export async function updateAttendanceStatus(
  employeeId: string,
  status: "present" | "absent" | "late",
  markedBy: string,
  date: string,
  period: "morning" | "afternoon",
): Promise<boolean> {
  try {
    // Validate that markedBy is a valid UUID
    if (!markedBy || markedBy.startsWith("user_")) {
      console.error("Invalid markedBy ID:", markedBy)
      // Use a default admin user ID for demo
      markedBy = "550e8400-e29b-41d4-a716-446655440001"
    }

    const { error } = await supabase.from("attendance").upsert(
      {
        employee_id: employeeId,
        date,
        period,
        status,
        marked_by: markedBy,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "employee_id,date,period",
      },
    )

    if (error) {
      console.error("Error updating attendance:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateAttendanceStatus:", error)
    return false
  }
}

export async function addAttendanceJustification(
  attendanceId: string,
  justificationType: string,
  justificationText: string,
  createdBy: string,
): Promise<boolean> {
  try {
    // Validate that createdBy is a valid UUID
    if (!createdBy || createdBy.startsWith("user_")) {
      createdBy = "550e8400-e29b-41d4-a716-446655440001"
    }

    const { error } = await supabase.from("attendance_justifications").upsert(
      {
        attendance_id: attendanceId,
        justification_type: justificationType,
        justification_text: justificationText,
        created_by: createdBy,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "attendance_id",
      },
    )

    if (error) {
      console.error("Error adding justification:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in addAttendanceJustification:", error)
    return false
  }
}

export async function getAttendanceStatsForDate(date: string): Promise<{
  totalEmployees: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number
}> {
  try {
    const [attendanceResult, employeesResult] = await Promise.all([
      supabase.from("attendance").select("status").eq("date", date),
      supabase.from("employees").select("id").eq("status", "active"),
    ])

    const attendance = attendanceResult.data || []
    const totalEmployees = employeesResult.data?.length || 0

    const stats = {
      totalEmployees,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      attendanceRate: 0,
    }

    attendance.forEach((record) => {
      if (record.status === "present") stats.presentCount++
      else if (record.status === "absent") stats.absentCount++
      else if (record.status === "late") stats.lateCount++
    })

    stats.attendanceRate =
      totalEmployees > 0 ? Math.round(((stats.presentCount + stats.lateCount) / totalEmployees) * 100) : 0

    return stats
  } catch (error) {
    console.error("Error in getAttendanceStatsForDate:", error)
    return {
      totalEmployees: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      attendanceRate: 0,
    }
  }
}
