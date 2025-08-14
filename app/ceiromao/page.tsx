"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, Calendar, AlertTriangle } from "lucide-react"
import { getEmployeeStats } from "@/lib/employee-management"
import { getFileStats } from "@/lib/teacher-files"
import { getAttendanceStatsForDate } from "@/lib/attendance"

export default function DashboardPage() {
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byDepartment: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    recentHires: [],
  })

  const [fileStats, setFileStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    overdue: 0,
  })

  const [attendanceStats, setAttendanceStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const today = new Date().toISOString().split("T")[0]
        const [empStats, fStats, attStats] = await Promise.all([
          getEmployeeStats(),
          getFileStats(),
          getAttendanceStatsForDate(today),
        ])

        setEmployeeStats(empStats)
        setFileStats(fStats)
        setAttendanceStats(attStats)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Ceiromao HR Portal</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {employeeStats.active} active, {employeeStats.inactive} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Requirements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {fileStats.submitted} submitted, {fileStats.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.presentCount} present, {attendanceStats.absentCount} absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Files</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fileStats.overdue}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
            <CardDescription>Distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(employeeStats.byDepartment).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dept}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Categories</CardTitle>
            <CardDescription>Breakdown by employment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(employeeStats.byCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{category}</span>
                  <Badge variant={category === "teacher" ? "default" : "secondary"}>{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-medium">Manage Employees</h3>
              <p className="text-sm text-gray-600">Add, edit, or view employee records</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <FileText className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-medium">Teacher Files</h3>
              <p className="text-sm text-gray-600">Track file requirements and submissions</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Calendar className="h-8 w-8 text-purple-500 mb-2" />
              <h3 className="font-medium">Mark Attendance</h3>
              <p className="text-sm text-gray-600">Record daily attendance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
