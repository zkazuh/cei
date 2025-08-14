import { supabase } from "./supabase"

export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  status: "present" | "absent" | "late" | "sick" | "vacation"
  check_in_time?: string
  check_out_time?: string
  notes?: string
  marked_by: string
  created_at: string
  updated_at: string
}

export interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
  sick: number
  vacation: number
  attendanceRate: number
}

export async function getAttendanceForDate(date: string): Promise<AttendanceRecord[]> {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("date", date)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching attendance for date:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAttendanceForDate:", error)
    return []
  }
}

export async function getAttendanceStatsForDate(date: string): Promise<AttendanceStats> {
  try {
    const { data, error } = await supabase.from("attendance").select("status").eq("date", date)

    if (error) {
      console.error("Error fetching attendance stats:", error)
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        sick: 0,
        vacation: 0,
        attendanceRate: 0,
      }
    }

    if (!data || data.length === 0) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        sick: 0,
        vacation: 0,
        attendanceRate: 0,
      }
    }

    const stats = {
      total: data.length,
      present: data.filter((record) => record.status === "present").length,
      absent: data.filter((record) => record.status === "absent").length,
      late: data.filter((record) => record.status === "late").length,
      sick: data.filter((record) => record.status === "sick").length,
      vacation: data.filter((record) => record.status === "vacation").length,
      attendanceRate: 0,
    }

    // Calculate attendance rate (present + late / total)
    stats.attendanceRate = stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0

    return stats
  } catch (error) {
    console.error("Error in getAttendanceStatsForDate:", error)
    return {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      sick: 0,
      vacation: 0,
      attendanceRate: 0,
    }
  }
}

export async function markAttendance(
  employeeId: string,
  date: string,
  status: "present" | "absent" | "late" | "sick" | "vacation",
  markedBy: string,
  checkInTime?: string,
  checkOutTime?: string,
  notes?: string,
): Promise<boolean> {
  try {
    // Use a default admin UUID if markedBy is invalid
    const validMarkedBy = markedBy || "00000000-0000-0000-0000-000000000001"

    const { error } = await supabase.from("attendance").upsert(
      {
        employee_id: employeeId,
        date,
        status,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        notes,
        marked_by: validMarkedBy,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "employee_id,date",
      },
    )

    if (error) {
      console.error("Error marking attendance:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in markAttendance:", error)
    return false
  }
}

export async function getEmployeeAttendance(
  employeeId: string,
  startDate: string,
  endDate: string,
): Promise<AttendanceRecord[]> {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })

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

export async function bulkMarkAttendance(
  records: Array<{
    employeeId: string
    date: string
    status: "present" | "absent" | "late" | "sick" | "vacation"
    checkInTime?: string
    checkOutTime?: string
    notes?: string
  }>,
  markedBy: string,
): Promise<boolean> {
  try {
    // Use a default admin UUID if markedBy is invalid
    const validMarkedBy = markedBy || "00000000-0000-0000-0000-000000000001"

    const attendanceRecords = records.map((record) => ({
      employee_id: record.employeeId,
      date: record.date,
      status: record.status,
      check_in_time: record.checkInTime,
      check_out_time: record.checkOutTime,
      notes: record.notes,
      marked_by: validMarkedBy,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from("attendance").upsert(attendanceRecords, {
      onConflict: "employee_id,date",
    })

    if (error) {
      console.error("Error bulk marking attendance:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in bulkMarkAttendance:", error)
    return false
  }
}

export async function deleteAttendanceRecord(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("attendance").delete().eq("id", id)

    if (error) {
      console.error("Error deleting attendance record:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteAttendanceRecord:", error)
    return false
  }
}

export async function getAttendanceHistory(limit = 100): Promise<AttendanceRecord[]> {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching attendance history:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAttendanceHistory:", error)
    return []
  }
}

export async function getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching attendance by date range:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAttendanceByDateRange:", error)
    return []
  }
}
