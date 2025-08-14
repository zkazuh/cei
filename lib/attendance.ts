import { supabase } from "./supabase"

export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  check_in_time?: string
  check_out_time?: string
  notes?: string
  marked_by: string
  created_at: string
  updated_at: string
  employees: {
    id: string
    name: string
    employee_number: string
    department: string
    position: string
    category: string
  }
}

export interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  excused: number
}

export async function getAttendanceRecords(date?: string): Promise<AttendanceRecord[]> {
  try {
    let query = supabase
      .from("attendance")
      .select(`
        *,
        employees (
          id,
          name,
          employee_number,
          department,
          position,
          category
        )
      `)
      .order("created_at", { ascending: false })

    if (date) {
      query = query.eq("date", date)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching attendance records:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAttendanceRecords:", error)
    return []
  }
}

export async function getAttendanceStats(date?: string): Promise<AttendanceStats> {
  try {
    let query = supabase.from("attendance").select("status")

    if (date) {
      query = query.eq("date", date)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching attendance stats:", error)
      return { total: 0, present: 0, absent: 0, late: 0, excused: 0 }
    }

    const stats = {
      total: data?.length || 0,
      present: data?.filter((record) => record.status === "present").length || 0,
      absent: data?.filter((record) => record.status === "absent").length || 0,
      late: data?.filter((record) => record.status === "late").length || 0,
      excused: data?.filter((record) => record.status === "excused").length || 0,
    }

    return stats
  } catch (error) {
    console.error("Error in getAttendanceStats:", error)
    return { total: 0, present: 0, absent: 0, late: 0, excused: 0 }
  }
}

// Dashboard-specific function for attendance stats
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

export async function updateAttendanceStatus(
  attendanceId: string,
  status: "present" | "absent" | "late" | "excused",
  markedBy: string,
  notes?: string,
): Promise<boolean> {
  try {
    // Validate UUID format for markedBy, use default admin UUID if invalid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const validMarkedBy = uuidRegex.test(markedBy) ? markedBy : "550e8400-e29b-41d4-a716-446655440000"

    const { error } = await supabase
      .from("attendance")
      .update({
        status,
        marked_by: validMarkedBy,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendanceId)

    if (error) {
      console.error("Error updating attendance status:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateAttendanceStatus:", error)
    return false
  }
}

export async function createAttendanceRecord(
  employeeId: string,
  date: string,
  status: "present" | "absent" | "late" | "excused",
  markedBy: string,
  checkInTime?: string,
  checkOutTime?: string,
  notes?: string,
): Promise<boolean> {
  try {
    // Validate UUID format for markedBy, use default admin UUID if invalid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const validMarkedBy = uuidRegex.test(markedBy) ? markedBy : "550e8400-e29b-41d4-a716-446655440000"

    const { error } = await supabase.from("attendance").insert({
      employee_id: employeeId,
      date,
      status,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      notes,
      marked_by: validMarkedBy,
    })

    if (error) {
      console.error("Error creating attendance record:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in createAttendanceRecord:", error)
    return false
  }
}

export async function getEmployeeAttendance(
  employeeId: string,
  startDate?: string,
  endDate?: string,
): Promise<AttendanceRecord[]> {
  try {
    let query = supabase
      .from("attendance")
      .select(`
        *,
        employees (
          id,
          name,
          employee_number,
          department,
          position,
          category
        )
      `)
      .eq("employee_id", employeeId)
      .order("date", { ascending: false })

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching employee attendance:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getEmployeeAttendance:", error)
    return []
  }
}

export async function bulkUpdateAttendance(
  updates: Array<{
    attendanceId: string
    status: "present" | "absent" | "late" | "excused"
    notes?: string
  }>,
  markedBy: string,
): Promise<boolean> {
  try {
    // Validate UUID format for markedBy, use default admin UUID if invalid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const validMarkedBy = uuidRegex.test(markedBy) ? markedBy : "550e8400-e29b-41d4-a716-446655440000"

    const promises = updates.map((update) =>
      supabase
        .from("attendance")
        .update({
          status: update.status,
          notes: update.notes,
          marked_by: validMarkedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.attendanceId),
    )

    const results = await Promise.all(promises)

    // Check if any updates failed
    const hasErrors = results.some((result) => result.error)

    if (hasErrors) {
      console.error("Some attendance updates failed")
      return false
    }

    return true
  } catch (error) {
    console.error("Error in bulkUpdateAttendance:", error)
    return false
  }
}

// Legacy function for backward compatibility
export async function getAttendanceForDate(date: string): Promise<AttendanceRecord[]> {
  return getAttendanceRecords(date)
}

// Legacy function for backward compatibility
export async function addAttendanceJustification(
  attendanceId: string,
  justificationType: string,
  justificationText: string,
  createdBy: string,
): Promise<boolean> {
  try {
    // Validate UUID format for createdBy, use default admin UUID if invalid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const validCreatedBy = uuidRegex.test(createdBy) ? createdBy : "550e8400-e29b-41d4-a716-446655440000"

    const { error } = await supabase.from("attendance_justifications").upsert(
      {
        attendance_id: attendanceId,
        justification_type: justificationType,
        justification_text: justificationText,
        created_by: validCreatedBy,
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
