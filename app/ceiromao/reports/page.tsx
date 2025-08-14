"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, FileText, Users } from "lucide-react"
import {
  getMonthlyAttendanceReport,
  generateReportPeriods,
  getCurrentReportPeriod,
  getAvailableYears,
  formatReportDate,
  getReportPeriodTitle,
  type AttendanceReportData,
  type ReportPeriod,
} from "@/lib/reports"

const attendanceCodeLabels = {
  C: "Present",
  F: "Absent",
  A: "Medical Leave",
  AF: "Justified Absent",
  CR: "Course",
  RE: "Recess",
  R: "Meeting",
}

const attendanceCodeColors = {
  C: "bg-green-100 text-green-800",
  F: "bg-red-100 text-red-800",
  A: "bg-blue-100 text-blue-800",
  AF: "bg-yellow-100 text-yellow-800",
  CR: "bg-purple-100 text-purple-800",
  RE: "bg-orange-100 text-orange-800",
  R: "bg-indigo-100 text-indigo-800",
}

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod | null>(null)
  const [reportData, setReportData] = useState<AttendanceReportData[]>([])
  const [loading, setLoading] = useState(false)
  const [availableYears] = useState(getAvailableYears())
  const [availablePeriods, setAvailablePeriods] = useState<ReportPeriod[]>([])

  // Initialize periods and current period
  useEffect(() => {
    const periods = generateReportPeriods(selectedYear)
    setAvailablePeriods(periods)

    if (!selectedPeriod) {
      const currentPeriod = getCurrentReportPeriod()
      setSelectedPeriod(currentPeriod)
    }
  }, [selectedYear, selectedPeriod])

  // Load report data when period changes
  useEffect(() => {
    if (selectedPeriod) {
      loadReportData(selectedPeriod)
    }
  }, [selectedPeriod])

  const loadReportData = async (period: ReportPeriod) => {
    setLoading(true)
    try {
      const { employees } = await getMonthlyAttendanceReport(period)
      setReportData(employees)
    } catch (error) {
      console.error("Error loading report data:", error)
      setReportData([])
    } finally {
      setLoading(false)
    }
  }

  const handleYearChange = (year: string) => {
    const yearNum = Number.parseInt(year)
    setSelectedYear(yearNum)
    setSelectedPeriod(null) // Reset period selection
  }

  const handlePeriodChange = (periodIndex: string) => {
    const period = availablePeriods[Number.parseInt(periodIndex)]
    setSelectedPeriod(period)
  }

  const exportToCSV = () => {
    if (!selectedPeriod || reportData.length === 0) return

    const headers = ["Employee", "Employee Number", "Department", "Position"]
    const dates: string[] = []

    // Get all dates in the period
    const currentDate = new Date(selectedPeriod.startDate)
    const endDate = new Date(selectedPeriod.endDate)

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split("T")[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    headers.push(...dates.map(formatReportDate))

    const csvContent = [
      headers.join(","),
      ...reportData.map((employee) => {
        const row = [
          employee.employee.name,
          employee.employee.employee_number,
          employee.employee.department,
          employee.employee.position,
        ]

        dates.forEach((date) => {
          const attendance = employee.attendance[date]
          const code = attendance?.merged || `${attendance?.morning || "F"}/${attendance?.afternoon || "F"}`
          row.push(code)
        })

        return row.join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-report-${selectedPeriod.label}-${selectedPeriod.year}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getDatesInPeriod = (period: ReportPeriod): string[] => {
    const dates: string[] = []
    const currentDate = new Date(period.startDate)
    const endDate = new Date(period.endDate)

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split("T")[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <p className="text-muted-foreground">Generate and export monthly attendance reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {selectedPeriod ? getReportPeriodTitle(selectedPeriod) : "Select Period"}
          </span>
        </div>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>Select the year and period for the attendance report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
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
                value={selectedPeriod ? availablePeriods.indexOf(selectedPeriod).toString() : ""}
                onValueChange={handlePeriodChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button
                onClick={exportToCSV}
                disabled={!selectedPeriod || reportData.length === 0 || loading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {selectedPeriod && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{reportData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Report Period</p>
                  <p className="text-lg font-semibold">{getReportPeriodTitle(selectedPeriod)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Working Days</p>
                  <p className="text-2xl font-bold">{getDatesInPeriod(selectedPeriod).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Report Table */}
      {selectedPeriod && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Report - {getReportPeriodTitle(selectedPeriod)}</CardTitle>
            <CardDescription>Daily attendance tracking for all regular employees</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading report data...</p>
                </div>
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No data available for the selected period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-2 text-left font-medium">Employee</th>
                      <th className="border border-gray-200 p-2 text-left font-medium">Number</th>
                      <th className="border border-gray-200 p-2 text-left font-medium">Department</th>
                      {getDatesInPeriod(selectedPeriod).map((date) => (
                        <th key={date} className="border border-gray-200 p-1 text-center font-medium text-xs">
                          {formatReportDate(date)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((employee) => (
                      <tr key={employee.employee.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2 font-medium">{employee.employee.name}</td>
                        <td className="border border-gray-200 p-2 text-sm">{employee.employee.employee_number}</td>
                        <td className="border border-gray-200 p-2 text-sm">{employee.employee.department}</td>
                        {getDatesInPeriod(selectedPeriod).map((date) => {
                          const attendance = employee.attendance[date]
                          const code =
                            attendance?.merged ||
                            (attendance?.morning === attendance?.afternoon
                              ? attendance?.morning
                              : `${attendance?.morning || "F"}/${attendance?.afternoon || "F"}`)

                          return (
                            <td key={date} className="border border-gray-200 p-1 text-center">
                              {code && code.length <= 2 ? (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${attendanceCodeColors[code as keyof typeof attendanceCodeColors] || "bg-gray-100 text-gray-800"}`}
                                >
                                  {code}
                                </Badge>
                              ) : (
                                <span className="text-xs font-mono">{code}</span>
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
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attendance Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(attendanceCodeLabels).map(([code, label]) => (
              <div key={code} className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${attendanceCodeColors[code as keyof typeof attendanceCodeColors]}`}
                >
                  {code}
                </Badge>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
