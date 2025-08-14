"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEmployeeStats } from "@/lib/employee-management"
import { getFileStats } from "@/lib/teacher-files"
import { getAttendanceStatsForDate } from "@/lib/attendance"
import { Users, FileText, Calendar, TrendingUp } from "lucide-react"

interface DashboardStats {
  employeeStats: {
    total: number
    active: number
    inactive: number
    byDepartment: Record<string, number>
    byCategory: Record<string, number>
    recentHires: any[]
  }
  fileStats: {
    total: number
    pending: number
    submitted: number
    overdue: number
  }
  attendanceStats: {
    totalEmployees: number
    presentCount: number
    absentCount: number
    lateCount: number
    attendanceRate: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    employeeStats: {
      total: 0,
      active: 0,
      inactive: 0,
      byDepartment: {},
      byCategory: {},
      recentHires: [],
    },
    fileStats: {
      total: 0,
      pending: 0,
      submitted: 0,
      overdue: 0,
    },
    attendanceStats: {
      totalEmployees: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      attendanceRate: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true)
        setError(null)

        const today = new Date().toISOString().split("T")[0]

        // Load stats with proper error handling
        const [empStats, fStats, attStats] = await Promise.allSettled([
          getEmployeeStats(),
          getFileStats(),
          getAttendanceStatsForDate(today),
        ])

        // Handle employee stats
        const employeeStats =
          empStats.status === "fulfilled"
            ? empStats.value
            : {
                total: 0,
                active: 0,
                inactive: 0,
                byDepartment: {},
                byCategory: {},
                recentHires: [],
              }

        // Handle file stats
        const fileStats =
          fStats.status === "fulfilled"
            ? fStats.value
            : {
                total: 0,
                pending: 0,
                submitted: 0,
                overdue: 0,
              }

        // Handle attendance stats
        const attendanceStats =
          attStats.status === "fulfilled"
            ? attStats.value
            : {
                totalEmployees: 0,
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                attendanceRate: 0,
              }

        setStats({
          employeeStats,
          fileStats,
          attendanceStats,
        })

        // Log any rejected promises
        if (empStats.status === "rejected") {
          console.error("Employee stats failed:", empStats.reason)
        }
        if (fStats.status === "rejected") {
          console.error("File stats failed:", fStats.reason)
        }
        if (attStats.status === "rejected") {
          console.error("Attendance stats failed:", attStats.reason)
        }
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Ceiromao HR Portal</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employeeStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.employeeStats.active} active, {stats.employeeStats.inactive} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceStats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.attendanceStats.presentCount} present, {stats.attendanceStats.absentCount} absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teacher Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fileStats.submitted}</div>
            <p className="text-xs text-muted-foreground">
              {stats.fileStats.pending} pending, {stats.fileStats.overdue} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Good</div>
            <p className="text-xs text-muted-foreground">Overall system health</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
            <CardDescription>Distribution of employees across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.keys(stats.employeeStats.byDepartment).length > 0 ? (
                Object.entries(stats.employeeStats.byDepartment).map(([dept, count]) => (
                  <div key={dept} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{dept}</span>
                    <span className="text-sm text-gray-600">{count}</span>
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
            <CardTitle>Employees by Category</CardTitle>
            <CardDescription>Breakdown by employee category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.keys(stats.employeeStats.byCategory).length > 0 ? (
                Object.entries(stats.employeeStats.byCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <span className="text-sm text-gray-600">{count}</span>
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
