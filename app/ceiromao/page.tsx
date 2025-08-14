"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getEmployeeStats } from "@/lib/employee-management"
import { getAttendanceStatsForDate } from "@/lib/attendance"
import { getTeacherFileStats } from "@/lib/teacher-files"
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Building,
  FileText,
  Clock,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react"

interface DashboardStats {
  employees: {
    total: number
    regular: number
    teacher: number
    outsourced: number
    active: number
    inactive: number
  }
  attendance: {
    total: number
    present: number
    absent: number
    late: number
    sick: number
    vacation: number
    attendanceRate: number
  }
  teacherFiles: {
    total: number
    pending: number
    submitted: number
    approved: number
    rejected: number
    overdue: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    employees: {
      total: 0,
      regular: 0,
      teacher: 0,
      outsourced: 0,
      active: 0,
      inactive: 0,
    },
    attendance: {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      sick: 0,
      vacation: 0,
      attendanceRate: 0,
    },
    teacherFiles: {
      total: 0,
      pending: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      overdue: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const today = new Date().toISOString().split("T")[0]

      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        getEmployeeStats(),
        getAttendanceStatsForDate(today),
        getTeacherFileStats(),
      ])

      const newStats: DashboardStats = {
        employees: {
          total: 0,
          regular: 0,
          teacher: 0,
          outsourced: 0,
          active: 0,
          inactive: 0,
        },
        attendance: {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          sick: 0,
          vacation: 0,
          attendanceRate: 0,
        },
        teacherFiles: {
          total: 0,
          pending: 0,
          submitted: 0,
          approved: 0,
          rejected: 0,
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

      // Handle teacher file stats
      if (results[2].status === "fulfilled") {
        newStats.teacherFiles = results[2].value
      } else {
        console.error("Failed to load teacher file stats:", results[2].reason)
      }

      setStats(newStats)

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of HR portal activities and statistics</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Employee Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.employees.active}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.employees.teacher}</div>
              <p className="text-xs text-muted-foreground">Teaching staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regular Staff</CardTitle>
              <Building className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.employees.regular}</div>
              <p className="text-xs text-muted-foreground">Administrative staff</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Attendance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendance.attendanceRate.toFixed(1)}%</div>
              <Progress value={stats.attendance.attendanceRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.attendance.present}</div>
              <p className="text-xs text-muted-foreground">On time arrivals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.attendance.late}</div>
              <p className="text-xs text-muted-foreground">Late arrivals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.attendance.absent}</div>
              <p className="text-xs text-muted-foreground">Not present</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Teacher Files Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Teacher Files Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teacherFiles.total}</div>
              <p className="text-xs text-muted-foreground">All file requirements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.teacherFiles.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting submission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.teacherFiles.submitted}</div>
              <p className="text-xs text-muted-foreground">Under review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.teacherFiles.approved}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.teacherFiles.overdue}</div>
              <p className="text-xs text-muted-foreground">Past deadline</p>
            </CardContent>
          </Card>
        </div>
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
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-medium">Manage Employees</h3>
                  <p className="text-sm text-gray-600">Add, edit, or view employee records</p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-medium">Mark Attendance</h3>
                  <p className="text-sm text-gray-600">Record daily attendance</p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-medium">Teacher Files</h3>
                  <p className="text-sm text-gray-600">Manage teacher file requirements</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
