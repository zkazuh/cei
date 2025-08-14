"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getEmployeeStats } from "@/lib/employee-management"
import { getAttendanceStatsForDate } from "@/lib/attendance"
import { getFileStats } from "@/lib/teacher-files"
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  GraduationCap,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from "lucide-react"

interface DashboardStats {
  employees: {
    total: number
    active: number
    inactive: number
    byDepartment: Record<string, number>
    byCategory: Record<string, number>
    byPosition: Record<string, number>
  }
  attendance: {
    totalEmployees: number
    presentToday: number
    absentToday: number
    attendanceRate: number
  }
  teacherFiles: {
    total: number
    pending: number
    submitted: number
    overdue: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    employees: {
      total: 0,
      active: 0,
      inactive: 0,
      byDepartment: {},
      byCategory: {},
      byPosition: {},
    },
    attendance: {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      attendanceRate: 0,
    },
    teacherFiles: {
      total: 0,
      pending: 0,
      submitted: 0,
      overdue: 0,
    },
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

      const newStats: DashboardStats = {
        employees: {
          total: 0,
          active: 0,
          inactive: 0,
          byDepartment: {},
          byCategory: {},
          byPosition: {},
        },
        attendance: {
          totalEmployees: 0,
          presentToday: 0,
          absentToday: 0,
          attendanceRate: 0,
        },
        teacherFiles: {
          total: 0,
          pending: 0,
          submitted: 0,
          overdue: 0,
        },
      }

      // Handle employee stats
      if (results[0].status === "fulfilled") {
        newStats.employees = results[0].value
      } else {
        console.error("Failed to load employee stats:", results[0].reason)
      }

      // Handle attendance stats
      if (results[1].status === "fulfilled") {
        newStats.attendance = results[1].value
      } else {
        console.error("Failed to load attendance stats:", results[1].reason)
      }

      // Handle teacher files stats
      if (results[2].status === "fulfilled") {
        newStats.teacherFiles = results[2].value
      } else {
        console.error("Failed to load teacher files stats:", results[2].reason)
      }

      setStats(newStats)

      // Show error if all requests failed
      const allFailed = results.every((result) => result.status === "rejected")
      if (allFailed) {
        setError("Failed to load dashboard data. Please check your database connection.")
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to the Ceiromao HR Portal</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employees.total}</div>
            <p className="text-xs text-muted-foreground">All registered employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.employees.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Employees</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.employees.inactive}</div>
            <p className="text-xs text-muted-foreground">Currently inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.attendance.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Today's attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.attendance.presentToday}</div>
            <p className="text-xs text-muted-foreground">Employees present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.attendance.absentToday}</div>
            <p className="text-xs text-muted-foreground">Employees absent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Marked</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {Math.max(
                0,
                stats.attendance.totalEmployees - stats.attendance.presentToday - stats.attendance.absentToday,
              )}
            </div>
            <p className="text-xs text-muted-foreground">Attendance not marked</p>
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
            <div className="text-2xl font-bold">{stats.teacherFiles.total}</div>
            <p className="text-xs text-muted-foreground">All teacher files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Files</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.teacherFiles.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted Files</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.teacherFiles.submitted}</div>
            <p className="text-xs text-muted-foreground">Successfully submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Files</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.teacherFiles.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Employees by Department
            </CardTitle>
            <CardDescription>Distribution of employees across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.employees.byDepartment).length > 0 ? (
                Object.entries(stats.employees.byDepartment)
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
              <GraduationCap className="h-5 w-5" />
              Employees by Category
            </CardTitle>
            <CardDescription>Distribution of employees by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.employees.byCategory).length > 0 ? (
                Object.entries(stats.employees.byCategory)
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
    </div>
  )
}
