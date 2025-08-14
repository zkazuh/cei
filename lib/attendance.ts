import { supabase } from "./supabase"
import type { AttendanceRecord } from "./supabase"

export interface AttendanceStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  attendanceRate: number
}

export interface AttendanceFilters {
  employeeId?: string
  date?: string
  status?: string
  department?: string
}

export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  try {
    const today = new Date().toISOString().split("T")[0]
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        employees (
          id,
          name,
          employee_number,
          department,
          position
        )
      `)
      .eq("date", today)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching today's attendance:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getTodayAttendance:", error)
    return []
  }
}

export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        employees (
          id,
          name,
          employee_number,
          department,
          position
        )
      `)
      .eq("date", date)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching attendance by date:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAttendanceByDate:", error)
    return []
  }
}

export async function getAttendanceStatsForDate(date: string): Promise<AttendanceStats> {
  try {
    // Get total active employees
    const { data: employees, error: empError } = await supabase.from("employees").select("id").eq("status", "active")

    if (empError) {
      console.error("Error fetching employees for stats:", empError)
      return { totalEmployees: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 }
    }

    const totalEmployees = employees?.length || 0

    // Get attendance for the date
    const { data: attendance, error: attError } = await supabase.from("attendance").select("status").eq("date", date)

    if (attError) {
      console.error("Error fetching attendance for stats:", attError)
      return { totalEmployees, presentToday: 0, absentToday: 0, attendanceRate: 0 }
    }

    const presentToday = attendance?.filter((record) => record.status === "present").length || 0
    const absentToday = attendance?.filter((record) => record.status === "absent").length || 0
    const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0

    return {
      totalEmployees,
      presentToday,
      absentToday,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    }
  } catch (error) {
    console.error("Error in getAttendanceStatsForDate:", error)
    return { totalEmployees: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 }
  }
}

export async function markAttendance(
  employeeId: string,
  date: string,
  status: "present" | "absent" | "late" | "half_day",
  markedBy = "00000000-0000-0000-0000-000000000000",
): Promise<boolean> {
  try {
    // Validate UUID format for markedBy
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const validMarkedBy = uuidRegex.test(markedBy) ? markedBy : "00000000-0000-0000-0000-000000000000"

    // Check if attendance already exists for this employee and date
    const { data: existing, error: checkError } = await supabase
      .from("attendance")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("date", date)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing attendance:", checkError)
      return false
    }

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from("attendance")
        .update({
          status,
          marked_by: validMarkedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) {
        console.error("Error updating attendance:", error)
        return false
      }
    } else {
      // Create new record
      const { error } = await supabase.from("attendance").insert({
        employee_id: employeeId,
        date,
        status,
        marked_by: validMarkedBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error creating attendance:", error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error in markAttendance:", error)
    return false
  }
}

export async function bulkMarkAttendance(
  records: Array<{
    employeeId: string
    date: string
    status: "present" | "absent" | "late" | "half_day"
  }>,
  markedBy = "00000000-0000-0000-0000-000000000000",
): Promise<boolean> {
  try {
    const promises = records.map((record) => markAttendance(record.employeeId, record.date, record.status, markedBy))

    const results = await Promise.all(promises)
    return results.every((result) => result === true)
  } catch (error) {
    console.error("Error in bulkMarkAttendance:", error)
    return false
  }
}

export async function getEmployeeAttendanceHistory(
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
          position
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
      console.error("Error fetching employee attendance history:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getEmployeeAttendanceHistory:", error)
    return []
  }
}

export async function getAttendanceReport(
  startDate: string,
  endDate: string,
  filters?: AttendanceFilters,
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
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })

    if (filters?.employeeId) {
      query = query.eq("employee_id", filters.employeeId)
    }

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.department && filters.department !== "all") {
      query = query.eq("employees.department", filters.department)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching attendance report:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAttendanceReport:", error)
    return []
  }
}

export async function deleteAttendanceRecord(recordId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("attendance").delete().eq("id", recordId)

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
