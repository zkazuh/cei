"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  getMonthlyAttendanceReport,
  generateReportPeriods,
  getCurrentReportPeriod,
  formatReportDate,
  getReportPeriodTitle,
  getAvailableYears,
  type AttendanceReportData,
  type ReportPeriod,
} from "@/lib/reports"
import { BarChart3, Download, Calendar, Users, FileText } from "lucide-react"

export default function ReportsPage() {
  const [reportData, setReportData] = useState<AttendanceReportData[]>([])
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>(getCurrentReportPeriod())
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [availablePeriods, setAvailablePeriods] = useState<ReportPeriod[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const years = getAvailableYears()
    setAvailableYears(years)

    const currentPeriod = getCurrentReportPeriod()
    setSelectedYear(currentPeriod.year)
    setSelectedPeriodIndex(currentPeriod.monthIndex)
  }, [])

  useEffect(() => {
    const periods = generateReportPeriods(selectedYear)
    setAvailablePeriods(periods)

    if (periods[selectedPeriodIndex]) {
      setReportPeriod(periods[selectedPeriodIndex])
    }
  }, [selectedYear, selectedPeriodIndex])

  useEffect(() => {
    loadReportData()
  }, [reportPeriod])

  const loadReportData = async () => {
    try {
      setLoading(true)
      const { employees } = await getMonthlyAttendanceReport(reportPeriod)
      setReportData(employees)
    } catch (error) {
      console.error("Error loading report data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    try {
      // Generate CSV headers
      const dates = []
      const currentDate = new Date(reportPeriod.startDate)
      const endDate = new Date(reportPeriod.endDate)

      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split("T")[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }

      const headers = [
        "Employee Number",
        "Name",
        "Department",
        "Position",
        ...dates.map((date) => formatReportDate(date)),
      ]

      // Generate CSV rows
      const rows = reportData.map((employee) => {
        const row = [
          employee.employee.employee_number,
          employee.employee.name,
          employee.employee.department,
          employee.employee.position,
        ]

        dates.forEach((date) => {
          const attendance = employee.attendance[date]
          if (attendance?.merged) {
            row.push(attendance.merged)
          } else if (attendance?.morning && attendance?.afternoon) {
            row.push(`${attendance.morning}/${attendance.afternoon}`)
          } else if (attendance?.morning) {
            row.push(attendance.morning)
          } else {
            row.push("F")
          }
        })

        return row
      })

      // Create CSV content
      const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `attendance_report_${getReportPeriodTitle(reportPeriod).replace(/[^a-zA-Z0-9]/g, "_")}.csv`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Report exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      })
    }
  }

  const getAttendanceCodeBadge = (code: string) => {
    const codeMap = {
      C: { label: "Present", variant: "default" as const, className: "bg-green-100 text-green-800" },
      F: { label: "Absent", variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      A: { label: "Medical", variant: "secondary" as const, className: "bg-blue-100 text-blue-800" },
      AF: { label: "Justified", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
      CR: { label: "Course", variant: "outline" as const, className: "bg-purple-100 text-purple-800" },
      RE: { label: "Recess", variant: "outline" as const, className: "bg-gray-100 text-gray-800" },
      R: { label: "Meeting", variant: "outline" as const, className: "bg-indigo-100 text-indigo-800" },
    }

    const config = codeMap[code as keyof typeof codeMap] || { label: code, variant: "outline" as const, className: "" }

    return (
      <Badge variant={config.variant} className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    )
  }

  const generateDateColumns = () => {
    const dates = []
    const currentDate = new Date(reportPeriod.startDate)
    const endDate = new Date(reportPeriod.endDate)

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split("T")[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading report...</div>
      </div>
    )
  }

  const dateColumns = generateDateColumns()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and export attendance reports</p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Period
          </CardTitle>
          <CardDescription>Select the period for the attendance report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select
                value={selectedPeriodIndex.toString()}
                onValueChange={(value) => setSelectedPeriodIndex(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map((period, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Selected Period</h3>
            <p className="text-sm text-gray-600">
              {getReportPeriodTitle(reportPeriod)} ({formatReportDate(reportPeriod.startDate)} to{" "}
              {formatReportDate(reportPeriod.endDate)})
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.length}</div>
            <p className="text-xs text-muted-foreground">In this report</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report Period</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dateColumns.length}</div>
            <p className="text-xs text-muted-foreground">Days covered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report Type</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Monthly</div>
            <p className="text-xs text-muted-foreground">Attendance report</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Codes</CardTitle>
          <CardDescription>Legend for attendance status codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getAttendanceCodeBadge("C")}
            {getAttendanceCodeBadge("F")}
            {getAttendanceCodeBadge("A")}
            {getAttendanceCodeBadge("AF")}
            {getAttendanceCodeBadge("CR")}
            {getAttendanceCodeBadge("RE")}
            {getAttendanceCodeBadge("R")}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Attendance Report - {getReportPeriodTitle(reportPeriod)}
          </CardTitle>
          <CardDescription>Monthly attendance report showing daily attendance for all employees</CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No attendance data found for this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    {dateColumns.map((date) => (
                      <th
                        key={date}
                        className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {formatReportDate(date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((employee) => (
                    <tr key={employee.employee.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-2 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.employee.employee_number}</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                        {employee.employee.department}
                      </td>
                      {dateColumns.map((date) => {
                        const attendance = employee.attendance[date]
                        let displayCode = "F"

                        if (attendance?.merged) {
                          displayCode = attendance.merged
                        } else if (attendance?.morning && attendance?.afternoon) {
                          if (attendance.morning === attendance.afternoon) {
                            displayCode = attendance.morning
                          } else {
                            displayCode = `${attendance.morning}/${attendance.afternoon}`
                          }
                        } else if (attendance?.morning) {
                          displayCode = attendance.morning
                        }

                        return (
                          <td key={date} className="border border-gray-300 px-1 py-2 text-center">
                            {displayCode.includes("/") ? (
                              <div className="flex flex-col gap-1">
                                {displayCode.split("/").map((code, index) => (
                                  <div key={index}>{getAttendanceCodeBadge(code)}</div>
                                ))}
                              </div>
                            ) : (
                              getAttendanceCodeBadge(displayCode)
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
