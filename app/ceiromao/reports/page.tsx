"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Calendar, Loader2, ChevronLeft, ChevronRight, Sun, Moon, BarChart3 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  getMonthlyAttendanceReport,
  formatReportDate,
  getReportPeriodTitle,
  generateReportPeriods,
  getCurrentReportPeriod,
  getAvailableYears,
} from "@/lib/reports"
import type { AttendanceReportData, ReportPeriod } from "@/lib/reports"

export default function ReportsPage() {
  const { user } = useAuth()
  const [reportData, setReportData] = useState<{
    reportPeriod: ReportPeriod
    employees: AttendanceReportData[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod | null>(null)
  const [availableYears] = useState<number[]>(getAvailableYears())
  const [availablePeriods, setAvailablePeriods] = useState<ReportPeriod[]>([])

  useEffect(() => {
    // Generate periods for selected year
    const periods = generateReportPeriods(selectedYear)
    setAvailablePeriods(periods)

    // Set current period if no period is selected or if year changed
    if (!selectedPeriod || selectedPeriod.year !== selectedYear) {
      const currentPeriod = getCurrentReportPeriod()
      if (currentPeriod.year === selectedYear) {
        setSelectedPeriod(currentPeriod)
      } else {
        setSelectedPeriod(periods[0]) // Default to first period of selected year
      }
    }
  }, [selectedYear])

  useEffect(() => {
    if (selectedPeriod) {
      fetchReport(selectedPeriod)
    }
  }, [selectedPeriod])

  const fetchReport = async (period: ReportPeriod) => {
    try {
      setIsLoading(true)
      const data = await getMonthlyAttendanceReport(period)
      setReportData(data)
    } catch (error) {
      console.error("Error fetching report:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const navigatePeriod = (direction: "prev" | "next") => {
    if (!selectedPeriod) return

    const currentIndex = availablePeriods.findIndex((p) => p.monthIndex === selectedPeriod.monthIndex)

    if (direction === "prev") {
      if (currentIndex > 0) {
        setSelectedPeriod(availablePeriods[currentIndex - 1])
      } else {
        // Go to previous year, last period
        const prevYear = selectedYear - 1
        const prevYearPeriods = generateReportPeriods(prevYear)
        setSelectedYear(prevYear)
        setSelectedPeriod(prevYearPeriods[prevYearPeriods.length - 1])
      }
    } else {
      if (currentIndex < availablePeriods.length - 1) {
        setSelectedPeriod(availablePeriods[currentIndex + 1])
      } else {
        // Go to next year, first period
        const nextYear = selectedYear + 1
        const nextYearPeriods = generateReportPeriods(nextYear)
        setSelectedYear(nextYear)
        setSelectedPeriod(nextYearPeriods[0])
      }
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    const { reportPeriod, employees } = reportData

    // Generate date headers
    const startDate = new Date(reportPeriod.startDate)
    const endDate = new Date(reportPeriod.endDate)
    const dates: string[] = []

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split("T")[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Create CSV headers - use merged format when possible, otherwise separate M/A columns
    const dateHeaders = dates.flatMap((date) => {
      // Check if any employee has different morning/afternoon status for this date
      const hasDifferentPeriods = employees.some((emp) => {
        const dayData = emp.attendance[date]
        return dayData && !dayData.merged && dayData.morning !== dayData.afternoon
      })

      if (hasDifferentPeriods) {
        return [`${formatReportDate(date)} M`, `${formatReportDate(date)} A`]
      } else {
        return [formatReportDate(date)]
      }
    })

    const headers = ["Employee", "Number", "Department", "Position", ...dateHeaders]

    const csvContent = [
      headers.join(","),
      ...employees.map((emp) => {
        const employeeData = [
          `"${emp.employee.name}"`,
          emp.employee.employee_number,
          `"${emp.employee.department}"`,
          `"${emp.employee.position}"`,
        ]

        // Add attendance data for each date
        dates.forEach((date) => {
          const dayData = emp.attendance[date]

          // Check if this date has different periods across all employees
          const hasDifferentPeriods = employees.some((e) => {
            const d = e.attendance[date]
            return d && !d.merged && d.morning !== d.afternoon
          })

          if (hasDifferentPeriods) {
            // Use separate morning/afternoon columns
            employeeData.push(dayData?.morning || "F")
            employeeData.push(dayData?.afternoon || "F")
          } else {
            // Use merged column
            employeeData.push(dayData?.merged || dayData?.morning || "F")
          }
        })

        return employeeData.join(",")
      }),
    ].join("\n")

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance-report-${reportPeriod.label.replace("/", "-")}-${reportPeriod.year}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Attendance report has been exported to CSV.",
    })
  }

  const getStatusBadge = (status: "C" | "F" | "A" | "AF" | "CR" | "RE" | "R") => {
    const badgeConfig = {
      C: { className: "bg-green-100 text-green-800", label: "C" },
      F: { className: "bg-red-100 text-red-800", label: "F" },
      A: { className: "bg-blue-100 text-blue-800", label: "A" },
      AF: { className: "bg-yellow-100 text-yellow-800", label: "AF" },
      CR: { className: "bg-purple-100 text-purple-800", label: "CR" },
      RE: { className: "bg-orange-100 text-orange-800", label: "RE" },
      R: { className: "bg-indigo-100 text-indigo-800", label: "R" },
    }

    const config = badgeConfig[status] || badgeConfig.F

    return (
      <Badge variant="default" className={`${config.className} text-xs`}>
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!reportData || !selectedPeriod) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load report data.</p>
        <Button onClick={() => selectedPeriod && fetchReport(selectedPeriod)} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const { reportPeriod, employees } = reportData

  // Generate date columns
  const startDate = new Date(reportPeriod.startDate)
  const endDate = new Date(reportPeriod.endDate)
  const dates: string[] = []

  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0])
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Reports
        </h1>
        <p className="text-muted-foreground">Generate and view various HR reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employee Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Available reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Reports</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Monthly reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Teacher file reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>
            This feature is coming soon. You'll be able to generate comprehensive reports for employees, attendance, and
            file submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Advanced reporting features will be available soon.</p>
          </div>
        </CardContent>
      </Card>

      {/* Period Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Period Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {/* Year Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Year:</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
              >
                <SelectTrigger className="w-24">
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

            {/* Period Navigation */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigatePeriod("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-[200px] text-center">
                <span className="font-medium">{getReportPeriodTitle(reportPeriod)}</span>
              </div>

              <Button variant="outline" size="sm" onClick={() => navigatePeriod("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Period Selection Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Period:</label>
              <Select
                value={selectedPeriod.monthIndex.toString()}
                onValueChange={(value) => {
                  const period = availablePeriods.find((p) => p.monthIndex === Number.parseInt(value))
                  if (period) setSelectedPeriod(period)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map((period) => (
                    <SelectItem key={period.monthIndex} value={period.monthIndex.toString()}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                C
              </Badge>
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-red-100 text-red-800">
                F
              </Badge>
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                A
              </Badge>
              <span className="text-sm">Medical Leave</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                AF
              </Badge>
              <span className="text-sm">Justified Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-purple-100 text-purple-800">
                CR
              </Badge>
              <span className="text-sm">Course</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-orange-100 text-orange-800">
                RE
              </Badge>
              <span className="text-sm">Recess</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-indigo-100 text-indigo-800">
                R
              </Badge>
              <span className="text-sm">Meeting</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Smart Merging:</strong> When an employee has the same status for both morning and afternoon
              periods, it's displayed as a single merged status. Different statuses show as separate morning/afternoon
              badges.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance</CardTitle>
          <CardDescription>
            {employees.length} employees • {dates.length} days • Smart period merging enabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium sticky left-0 bg-white border-r">Employee</th>
                  <th className="text-left p-2 font-medium">Dept.</th>
                  {dates.map((date) => (
                    <th key={date} className="text-center p-1 font-medium min-w-[60px]">
                      <div className="flex flex-col">
                        <span>{formatReportDate(date)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.employee.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 sticky left-0 bg-white border-r">
                      <div>
                        <div className="font-medium">{employee.employee.name}</div>
                        <div className="text-xs text-gray-500">{employee.employee.employee_number}</div>
                      </div>
                    </td>
                    <td className="p-2 text-xs text-gray-600">{employee.employee.department}</td>
                    {dates.map((date) => {
                      const dayData = employee.attendance[date]

                      return (
                        <td key={date} className="text-center p-1">
                          {dayData?.merged ? (
                            // Show single merged badge when both periods have same status
                            <div className="flex justify-center">{getStatusBadge(dayData.merged)}</div>
                          ) : (
                            // Show separate morning/afternoon badges when different
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center justify-center space-x-1">
                                <Sun className="h-2 w-2 text-yellow-500" />
                                {getStatusBadge(dayData?.morning || "F")}
                              </div>
                              <div className="flex items-center justify-center space-x-1">
                                <Moon className="h-2 w-2 text-blue-500" />
                                {getStatusBadge(dayData?.afternoon || "F")}
                              </div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{dates.length}</p>
                <p className="text-sm text-gray-600">Report Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    (employees.reduce(
                      (total, emp) =>
                        total +
                        Object.values(emp.attendance).reduce((dayTotal, day) => {
                          if (day.merged) {
                            // If merged, count as 2 periods if present, 0 if not
                            return dayTotal + (day.merged === "C" ? 2 : 0)
                          } else {
                            // Count individual periods
                            const morningPresent = day.morning === "C" ? 1 : 0
                            const afternoonPresent = day.afternoon === "C" ? 1 : 0
                            return dayTotal + morningPresent + afternoonPresent
                          }
                        }, 0),
                      0,
                    ) /
                      (employees.length * dates.length * 2)) * // *2 for morning and afternoon
                      100,
                  )}
                  %
                </p>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
