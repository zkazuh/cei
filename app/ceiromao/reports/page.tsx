"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Loader2, BarChart3, TrendingUp, Calendar, Users, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  getMonthlyAttendanceReport,
  formatReportDate,
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
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and view various HR reports and analytics</p>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Employee Reports
            </CardTitle>
            <CardDescription>Generate reports about employee data, demographics, and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Employee Directory
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <TrendingUp className="h-4 w-4 mr-2" />
                Department Analysis
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Calendar className="h-4 w-4 mr-2" />
                Hiring Trends
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Attendance Reports
            </CardTitle>
            <CardDescription>Track attendance patterns, absences, and working hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <BarChart3 className="h-4 w-4 mr-2" />
                Daily Attendance
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <TrendingUp className="h-4 w-4 mr-2" />
                Monthly Summary
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Absence Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              File Reports
            </CardTitle>
            <CardDescription>Monitor file submissions, requirements, and compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Submission Status
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Calendar className="h-4 w-4 mr-2" />
                Overdue Files
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <TrendingUp className="h-4 w-4 mr-2" />
                Compliance Rates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>Generate commonly requested reports with one click</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="h-16 flex-col" onClick={() => exportToCSV()}>
              <Download className="h-6 w-6 mb-2" />
              Export All Employees
            </Button>
            <Button className="h-16 flex-col bg-transparent" variant="outline">
              <Calendar className="h-6 w-6 mb-2" />
              This Month's Attendance
            </Button>
            <Button className="h-16 flex-col bg-transparent" variant="outline">
              <FileText className="h-6 w-6 mb-2" />
              Pending File Requirements
            </Button>
            <Button className="h-16 flex-col bg-transparent" variant="outline">
              <BarChart3 className="h-6 w-6 mb-2" />
              Department Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
          <CardDescription>More detailed reporting features are coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              Advanced reporting features including custom date ranges, detailed analytics, and automated report
              scheduling will be available soon.
            </p>
            <Button variant="outline">Request Feature</Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Center */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {/* Year Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Year:</label>
              {/* Placeholder for Select component */}
              <div className="w-24 bg-gray-100 rounded-lg px-3 py-2">Select Year</div>
            </div>

            {/* Period Navigation */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigatePeriod("prev")}>
                {/* Placeholder for ChevronLeft component */}
                <div className="h-4 w-4 mb-2 bg-gray-100 rounded-lg">Prev</div>
              </Button>

              <div className="min-w-[200px] text-center">
                <span className="font-medium">{reportPeriod.label}</span>
              </div>

              <Button variant="outline" size="sm" onClick={() => navigatePeriod("next")}>
                {/* Placeholder for ChevronRight component */}
                <div className="h-4 w-4 mb-2 bg-gray-100 rounded-lg">Next</div>
              </Button>
            </div>

            {/* Period Selection Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Period:</label>
              {/* Placeholder for Select component */}
              <div className="w-40 bg-gray-100 rounded-lg px-3 py-2">Select Period</div>
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
                                {/* Placeholder for Sun component */}
                                <div className="h-2 w-2 text-yellow-500">Sun</div>
                                {getStatusBadge(dayData?.morning || "F")}
                              </div>
                              <div className="flex items-center justify-center space-x-1">
                                {/* Placeholder for Moon component */}
                                <div className="h-2 w-2 text-blue-500">Moon</div>
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
