import { supabase } from "./supabase"

export interface AttendanceReport {
  employee_id: string
  employee_name: string
  employee_number: string
  department: string
  position: string
  category: string
  total_days: number
  present_days: number
  absent_days: number
  late_days: number
  excused_days: number
  attendance_rate: number
}

export interface PeriodReport {
  period: string
  total_employees: number
  total_days: number
  present_days: number
  absent_days: number
  late_days: number
  excused_days: number
  overall_attendance_rate: number
  employees: AttendanceReport[]
}

export async function getAttendanceReport(
  startDate: string,
  endDate: string,
  employeeIds?: string[],
): Promise<AttendanceReport[]> {
  try {
    let query = supabase
      .from("attendance")
      .select(`
        employee_id,
        status,
        employees!inner (
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
      .in("employees.category", ["regular", "teacher"]) // Only include regular and teacher employees

    if (employeeIds && employeeIds.length > 0) {
      query = query.in("employee_id", employeeIds)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching attendance report:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Group by employee and calculate statistics
    const employeeStats = new Map<
      string,
      {
        employee: any
        statuses: string[]
      }
    >()

    data.forEach((record) => {
      const employeeId = record.employee_id
      if (!employeeStats.has(employeeId)) {
        employeeStats.set(employeeId, {
          employee: record.employees,
          statuses: [],
        })
      }
      employeeStats.get(employeeId)!.statuses.push(record.status)
    })

    // Calculate report data
    const reports: AttendanceReport[] = []

    employeeStats.forEach((stats, employeeId) => {
      const totalDays = stats.statuses.length
      const presentDays = stats.statuses.filter((s) => s === "present").length
      const absentDays = stats.statuses.filter((s) => s === "absent").length
      const lateDays = stats.statuses.filter((s) => s === "late").length
      const excusedDays = stats.statuses.filter((s) => s === "excused").length
      const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0

      reports.push({
        employee_id: employeeId,
        employee_name: stats.employee.name,
        employee_number: stats.employee.employee_number,
        department: stats.employee.department,
        position: stats.employee.position,
        category: stats.employee.category,
        total_days: totalDays,
        present_days: presentDays,
        absent_days: absentDays,
        late_days: lateDays,
        excused_days: excusedDays,
        attendance_rate: Math.round(attendanceRate * 100) / 100,
      })
    })

    return reports.sort((a, b) => a.employee_name.localeCompare(b.employee_name))
  } catch (error) {
    console.error("Error in getAttendanceReport:", error)
    return []
  }
}

export async function getPeriodReport(startDate: string, endDate: string): Promise<PeriodReport> {
  try {
    const reports = await getAttendanceReport(startDate, endDate)

    const totalEmployees = reports.length
    const totalDays = reports.reduce((sum, r) => sum + r.total_days, 0)
    const presentDays = reports.reduce((sum, r) => sum + r.present_days, 0)
    const absentDays = reports.reduce((sum, r) => sum + r.absent_days, 0)
    const lateDays = reports.reduce((sum, r) => sum + r.late_days, 0)
    const excusedDays = reports.reduce((sum, r) => sum + r.excused_days, 0)
    const overallAttendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0

    return {
      period: `${startDate} to ${endDate}`,
      total_employees: totalEmployees,
      total_days: totalDays,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      excused_days: excusedDays,
      overall_attendance_rate: Math.round(overallAttendanceRate * 100) / 100,
      employees: reports,
    }
  } catch (error) {
    console.error("Error in getPeriodReport:", error)
    return {
      period: `${startDate} to ${endDate}`,
      total_employees: 0,
      total_days: 0,
      present_days: 0,
      absent_days: 0,
      late_days: 0,
      excused_days: 0,
      overall_attendance_rate: 0,
      employees: [],
    }
  }
}

export async function exportAttendanceReport(
  startDate: string,
  endDate: string,
  employeeIds?: string[],
): Promise<string> {
  try {
    const reports = await getAttendanceReport(startDate, endDate, employeeIds)

    // Create CSV content
    const headers = [
      "Employee Number",
      "Employee Name",
      "Department",
      "Position",
      "Category",
      "Total Days",
      "Present Days",
      "Absent Days",
      "Late Days",
      "Excused Days",
      "Attendance Rate (%)",
    ]

    const csvContent = [
      headers.join(","),
      ...reports.map((report) =>
        [
          report.employee_number,
          `"${report.employee_name}"`,
          `"${report.department}"`,
          `"${report.position}"`,
          report.category,
          report.total_days,
          report.present_days,
          report.absent_days,
          report.late_days,
          report.excused_days,
          report.attendance_rate,
        ].join(","),
      ),
    ].join("\n")

    return csvContent
  } catch (error) {
    console.error("Error in exportAttendanceReport:", error)
    return ""
  }
}

export async function getAttendanceTrends(
  employeeId: string,
  months = 6,
): Promise<
  Array<{
    month: string
    attendance_rate: number
    total_days: number
    present_days: number
  }>
> {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const { data, error } = await supabase
      .from("attendance")
      .select("date, status")
      .eq("employee_id", employeeId)
      .gte("date", startDate.toISOString().split("T")[0])
      .lte("date", endDate.toISOString().split("T")[0])
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching attendance trends:", error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Group by month
    const monthlyData = new Map<string, { present: number; total: number }>()

    data.forEach((record) => {
      const month = record.date.substring(0, 7) // YYYY-MM format
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { present: 0, total: 0 })
      }
      const monthData = monthlyData.get(month)!
      monthData.total++
      if (record.status === "present" || record.status === "late") {
        monthData.present++
      }
    })

    // Convert to array and calculate rates
    const trends = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      attendance_rate: data.total > 0 ? Math.round((data.present / data.total) * 10000) / 100 : 0,
      total_days: data.total,
      present_days: data.present,
    }))

    return trends.sort((a, b) => a.month.localeCompare(b.month))
  } catch (error) {
    console.error("Error in getAttendanceTrends:", error)
    return []
  }
}
