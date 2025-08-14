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

export interface ReportPeriod {
  year: number
  monthIndex: number
  label: string
  startDate: string
  endDate: string
}

export interface AttendanceReportData {
  employee: {
    id: string
    name: string
    employee_number: string
    department: string
    position: string
    category: string
  }
  attendance: {
    [date: string]: {
      morning?: string
      afternoon?: string
      merged?: string
    }
  }
}

export interface MonthlyAttendanceReport {
  period: ReportPeriod
  employees: AttendanceReportData[]
  summary: {
    totalEmployees: number
    totalDays: number
    averageAttendanceRate: number
  }
}

export function generateReportPeriods(year: number): ReportPeriod[] {
  const periods: ReportPeriod[] = []

  for (let month = 0; month < 12; month++) {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0) // Last day of month

    periods.push({
      year,
      monthIndex: month,
      label: startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    })
  }

  return periods
}

export function getCurrentReportPeriod(): ReportPeriod {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const periods = generateReportPeriods(year)
  return periods[month]
}

export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear()
  const years = []

  // Generate years from 2020 to current year + 1
  for (let year = 2020; year <= currentYear + 1; year++) {
    years.push(year)
  }

  return years
}

export function formatReportDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function getReportPeriodTitle(period: ReportPeriod): string {
  return period.label
}

export async function getMonthlyAttendanceReport(period: ReportPeriod): Promise<MonthlyAttendanceReport> {
  try {
    // Get all employees (teachers and regular employees, exclude outsourced)
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, name, employee_number, department, position, category")
      .in("category", ["regular", "teacher"])
      .eq("status", "active")
      .order("name")

    if (empError) {
      console.error("Error fetching employees:", empError)
      return {
        period,
        employees: [],
        summary: { totalEmployees: 0, totalDays: 0, averageAttendanceRate: 0 },
      }
    }

    if (!employees || employees.length === 0) {
      return {
        period,
        employees: [],
        summary: { totalEmployees: 0, totalDays: 0, averageAttendanceRate: 0 },
      }
    }

    // Get attendance data for the period
    const { data: attendance, error: attError } = await supabase
      .from("attendance")
      .select("employee_id, date, status, period")
      .gte("date", period.startDate)
      .lte("date", period.endDate)
      .in(
        "employee_id",
        employees.map((emp) => emp.id),
      )

    if (attError) {
      console.error("Error fetching attendance:", attError)
    }

    // Process attendance data
    const employeeReports: AttendanceReportData[] = employees.map((employee) => {
      const employeeAttendance: { [date: string]: { morning?: string; afternoon?: string; merged?: string } } = {}

      // Get attendance records for this employee
      const empAttendance = attendance?.filter((att) => att.employee_id === employee.id) || []

      // Group by date and period
      empAttendance.forEach((att) => {
        if (!employeeAttendance[att.date]) {
          employeeAttendance[att.date] = {}
        }

        // Convert status to attendance code
        let code = "F" // Default to absent
        switch (att.status) {
          case "present":
            code = "C"
            break
          case "absent":
            code = "F"
            break
          case "late":
            code = "C" // Late is still considered present
            break
          case "sick":
            code = "A"
            break
          case "vacation":
            code = "AF"
            break
          case "half_day":
            code = "C"
            break
          default:
            code = "F"
        }

        if (att.period === "morning") {
          employeeAttendance[att.date].morning = code
        } else if (att.period === "afternoon") {
          employeeAttendance[att.date].afternoon = code
        } else {
          // If no period specified, treat as full day
          employeeAttendance[att.date].merged = code
        }
      })

      // Merge morning and afternoon periods where both exist
      Object.keys(employeeAttendance).forEach((date) => {
        const dayAttendance = employeeAttendance[date]
        if (dayAttendance.morning && dayAttendance.afternoon) {
          if (dayAttendance.morning === dayAttendance.afternoon) {
            dayAttendance.merged = dayAttendance.morning
            delete dayAttendance.morning
            delete dayAttendance.afternoon
          }
        }
      })

      return {
        employee: {
          id: employee.id,
          name: employee.name,
          employee_number: employee.employee_number,
          department: employee.department,
          position: employee.position,
          category: employee.category,
        },
        attendance: employeeAttendance,
      }
    })

    // Calculate summary statistics
    const totalDays =
      Math.ceil((new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    const totalEmployees = employees.length

    return {
      period,
      employees: employeeReports,
      summary: {
        totalEmployees,
        totalDays,
        averageAttendanceRate: 0, // Could calculate this based on attendance data
      },
    }
  } catch (error) {
    console.error("Error in getMonthlyAttendanceReport:", error)
    return {
      period,
      employees: [],
      summary: { totalEmployees: 0, totalDays: 0, averageAttendanceRate: 0 },
    }
  }
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
