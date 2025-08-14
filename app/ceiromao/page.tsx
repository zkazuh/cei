"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getEmployeeStats } from "@/lib/employee-management"
import { getAttendanceStatsForDate } from "@/lib/attendance"
import { getFileStats } from "@/lib/teacher-files"
import {
  Users,
  UserCheck,
  UserX,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Building,
  Briefcase,
} from "lucide-react"
import type { EmployeeStats } from "@/lib/employee-management"
import type { AttendanceStats } from "@/lib/attendance"
import type { FileStats } from "@/lib/teacher-files"

export default function DashboardPage() {
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats>({
    total: 0,
    active: 0,
    inactive: 0,
    byDepartment: {},
    byPosition: {},
    byCategory: {},
  })
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
  })
  const [fileStats, setFileStats] = useState<FileStats>({
    total: 0,
    pending: 0,
    submitted: 0,
    overdue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const today = new Date().toISOString().split("T")[0]

      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([getEmployeeStats(), getAttendanceStatsForDate(today), getFileStats()])

      // Handle employee stats
      if (results[0].status === "fulfilled") {
        setEmployeeStats(results[0].value)
      } else {
        console.error("Failed to load employee stats:", results[0].reason)
      }

      // Handle attendance stats
      if (results[1].status === "fulfilled") {
        setAttendanceStats(results[1].value)
      } else {
        console.error("Failed to load attendance stats:", results[1].reason)
      }

      // Handle file stats
      if (results[2].status === "fulfilled") {
        setFileStats(results[2].value)
      } else {
        console.error("Failed to load file stats:", results[2].reason)
      }

      // Check if all requests failed
      const allFailed = results.every((result) => result.status === "rejected")
      if (allFailed) {
        setError("Failed to load dashboard data. Please check your connection and try again.")
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setError("An unexpected error occurred while loading the dashboard.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg text-red-600">{error}</div>
        <button onClick={loadDashboardData} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your HR portal</p>
      </div>

      {/* Employee Overview */}
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
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.presentToday}</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.attendanceRate.toFixed(1)}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absentToday}</div>
            <p className="text-xs text-muted-foreground">Out of {attendanceStats.totalEmployees} total employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.attendanceRate.toFixed(1)}%</div>
            <Progress value={attendanceStats.attendanceRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Teacher Files Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileStats.total}</div>
            <p className="text-xs text-muted-foreground">All file requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Files</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{fileStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted Files</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fileStats.submitted}</div>
            <p className="text-xs text-muted-foreground">Completed submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Files</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fileStats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Department and Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Employees by Department
            </CardTitle>
            <CardDescription>Distribution of employees across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(employeeStats.byDepartment).length > 0 ? (
                Object.entries(employeeStats.byDepartment)
                  .sort(([, a], [, b]) => b - a)
                  .map(([department, count]) => (
                    <div key={department} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{department}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500">No department data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employees by Category
            </CardTitle>
            <CardDescription>Distribution of employees by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(employeeStats.byCategory).length > 0 ? (
                Object.entries(employeeStats.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500">No category data available</p>
              )}
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
              <h3 className="font-medium">Mark Attendance</h3>
              <p className="text-sm text-gray-600">Record today's attendance</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Add Employee</h3>
              <p className="text-sm text-gray-600">Register a new employee</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Generate Report</h3>
              <p className="text-sm text-gray-600">Create attendance reports</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
