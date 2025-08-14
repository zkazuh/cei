import { supabase } from "./supabase"

export interface AttendanceReportData {
  employee: {
    id: string
    name: string
    employee_number: string
    department: string
    position: string
  }
  attendance: {
    [date: string]: {
      morning?: "C" | "F" | "A" | "AF" | "CR" | "RE" | "R"
      afternoon?: "C" | "F" | "A" | "AF" | "CR" | "RE" | "R"
      merged?: "C" | "F" | "A" | "AF" | "CR" | "RE" | "R" // When both periods have same status
    }
  }
}

export interface ReportPeriod {
  startDate: string
  endDate: string
  label: string
  year: number
  monthIndex: number
}

export function generateReportPeriods(year: number): ReportPeriod[] {
  const periods: ReportPeriod[] = []

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  for (let month = 0; month < 12; month++) {
    const startMonth = month
    const endMonth = month + 1

    // Handle year transition for December to January
    const startYear = year
    const endYear = endMonth > 11 ? year + 1 : year
    const actualEndMonth = endMonth > 11 ? 0 : endMonth

    const startDate = new Date(startYear, startMonth, 11)
    const endDate = new Date(endYear, actualEndMonth, 10)

    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    const label = `${monthNames[startMonth]}/${monthNames[actualEndMonth]}`

    periods.push({
      startDate: startDateStr,
      endDate: endDateStr,
      label,
      year: startYear,
      monthIndex: month,
    })
  }

  return periods
}

export function getCurrentReportPeriod(): ReportPeriod {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const currentDay = today.getDate()

  // If we're before the 11th, we're in the previous period
  // If we're on or after the 11th, we're in the current period
  let periodMonth = currentMonth
  let periodYear = currentYear

  if (currentDay < 11) {
    periodMonth = currentMonth - 1
    if (periodMonth < 0) {
      periodMonth = 11
      periodYear = currentYear - 1
    }
  }

  const periods = generateReportPeriods(periodYear)
  return periods[periodMonth]
}

function getAttendanceCode(
  status: "present" | "absent",
  justificationType?: "medical" | "justified" | "banked_hours" | "other" | "course" | "recess" | "meeting",
): "C" | "F" | "A" | "AF" | "CR" | "RE" | "R" {
  if (status === "present") {
    return "C" // Present
  } else {
    // Absent - check justification type
    switch (justificationType) {
      case "medical":
        return "A" // Medical Leave
      case "justified":
        return "AF" // Justified Absent
      case "course":
        return "CR" // Course
      case "recess":
        return "RE" // Recess
      case "meeting":
        return "R" // Meeting
      default:
        return "F" // Absent (no justification)
    }
  }
}

export async function getMonthlyAttendanceReport(period?: ReportPeriod): Promise<{
  reportPeriod: ReportPeriod
  employees: AttendanceReportData[]
}> {
  try {
    const reportPeriod = period || getCurrentReportPeriod()

    // Get all employees - EXCLUDE OUTSOURCED from reports
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select(`
        id,
        employee_number,
        department,
        position,
        users!inner(name)
      `)
      .eq("is_active", true)
      .eq("category", "regular") // Only include regular employees in reports
      .order("employee_number")

    if (employeesError) {
      console.error("Error fetching employees:", employeesError)
      return { reportPeriod, employees: [] }
    }

    // --- fetch attendance with graceful fallback -------------------
    const baseSelect = `
        employee_id,
        date,
        status,
        attendance_justifications(justification_type)
      ` as const

    // try with `period` first (the new column)
    let attendanceSelect = `${baseSelect}, period`
    let { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance")
      .select(attendanceSelect)
      .gte("date", reportPeriod.startDate)
      .lte("date", reportPeriod.endDate)

    // if the column doesn't exist, retry without it and treat everything as morning
    if (attendanceError && /period/.test(attendanceError.message)) {
      console.warn(
        "[attendance-report] The `period` column is missing. Falling back to single-period mode. " +
          "Run scripts/016_update_attendance_structure.sql to add it.",
      )

      attendanceSelect = baseSelect
      ;({ data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select(attendanceSelect)
        .gte("date", reportPeriod.startDate)
        .lte("date", reportPeriod.endDate))

      // when period is missing, we'll consider every record as morning
      attendanceData = (attendanceData || []).map((rec: any) => ({ ...rec, period: "morning" }))
    }

    if (attendanceError) {
      console.error("Error fetching attendance:", attendanceError)
      return { reportPeriod, employees: [] }
    }

    // Process the data
    const reportData: AttendanceReportData[] = employees.map((employee) => {
      const attendance: { [date: string]: { morning?: any; afternoon?: any; merged?: any } } = {}

      // Generate all dates in the period
      const currentDate = new Date(reportPeriod.startDate)
      const endDate = new Date(reportPeriod.endDate)

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0]
        attendance[dateStr] = {}

        // Find attendance records for this employee and date
        const morningRecord = attendanceData?.find(
          (record) => record.employee_id === employee.id && record.date === dateStr && record.period === "morning",
        )
        const afternoonRecord = attendanceData?.find(
          (record) => record.employee_id === employee.id && record.date === dateStr && record.period === "afternoon",
        )

        // Process morning attendance
        if (morningRecord) {
          const justification = morningRecord.attendance_justifications?.[0]
          attendance[dateStr].morning = getAttendanceCode(morningRecord.status, justification?.justification_type)
        } else {
          attendance[dateStr].morning = "F" // No record means absent
        }

        // Process afternoon attendance
        if (afternoonRecord) {
          const justification = afternoonRecord.attendance_justifications?.[0]
          attendance[dateStr].afternoon = getAttendanceCode(afternoonRecord.status, justification?.justification_type)
        } else {
          attendance[dateStr].afternoon = "F" // No record means absent
        }

        // Check if both periods have the same status - if so, merge them
        const morningStatus = attendance[dateStr].morning
        const afternoonStatus = attendance[dateStr].afternoon

        if (morningStatus && afternoonStatus && morningStatus === afternoonStatus) {
          attendance[dateStr].merged = morningStatus
          // Keep individual periods for reference but they won't be displayed
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      return {
        employee: {
          id: employee.id,
          name: employee.users.name,
          employee_number: employee.employee_number,
          department: employee.department || "",
          position: employee.position || "",
        },
        attendance,
      }
    })

    return {
      reportPeriod,
      employees: reportData,
    }
  } catch (error) {
    console.error("Error generating attendance report:", error)
    const fallbackPeriod = getCurrentReportPeriod()
    return { reportPeriod: fallbackPeriod, employees: [] }
  }
}

export function formatReportDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

export function getReportPeriodTitle(period: ReportPeriod): string {
  return `${period.label} ${period.year}${period.label.includes("December/January") ? `/${period.year + 1}` : ""}`
}

export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear()
  const years = []

  // Show 2 years before current year to 2 years after
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    years.push(year)
  }

  return years
}
