"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getEmployeeStats } from "@/lib/employee-management"
import { getAttendanceStatsForDate } from "@/lib/attendance"
import { getTeacherFileStats } from "@/lib/teacher-files"
import { Users, Clock, FileText, TrendingUp, Calendar, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface DashboardStats {
  employees: {
    total: number
    active: number
    inactive: number
    byDepartment: { [key: string]: number }
    byCategory: { [key: string]: number }
  }
  attendance: {
    totalEmployees: number
    presentCount: number
    absentCount: number
    lateCount: number
    attendanceRate: number
  }
  files: {
    totalFiles: number
    pendingFiles: number
    submittedFiles: number
    approvedFiles: number
    rejectedFiles: number
    totalRequirements: number
    completedRequirements: number
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
    },
    attendance: {
      totalEmployees: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      attendanceRate: 0,
    },
    files: {
      totalFiles: 0,
      pendingFiles: 0,
      submittedFiles: 0,
      approvedFiles: 0,
      rejectedFiles: 0,
      totalRequirements: 0,
      completedRequirements: 0,
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

      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        getEmployeeStats(),
        getAttendanceStatsForDate(today),
        getTeacherFileStats(),
      ])

      // Process employee stats
      const employeeStats =
        results[0].status === "fulfilled"
          ? results[0].value
          : {
              totalEmployees: 0,
              activeEmployees: 0,
              inactiveEmployees: 0,
              byDepartment: {},
              byCategory: {},
            }

      // Process attendance stats
      const attendanceStats =
        results[1].status === "fulfilled"
          ? results[1].value
          : {
              totalEmployees: 0,
              presentCount: 0,
              absentCount: 0,
              lateCount: 0,
              attendanceRate: 0,
            }

      // Process file stats
      const fileStats =
        results[2].status === "fulfilled"
          ? results[2].value
          : {
              totalFiles: 0,
              pendingFiles: 0,
              submittedFiles: 0,
              approvedFiles: 0,
              rejectedFiles: 0,
              totalRequirements: 0,
              completedRequirements: 0,
            }

      setStats({
        employees: {
          total: employeeStats.totalEmployees,
          active: employeeStats.activeEmployees,
          inactive: employeeStats.inactiveEmployees,
          byDepartment: employeeStats.byDepartment,
          byCategory: employeeStats.byCategory,
        },
        attendance: attendanceStats,
        files: fileStats,
      })

      // Check for any failures and set error message
      const failures = results.filter((result) => result.status === "rejected")
      if (failures.length > 0) {
        console.warn("Some dashboard data failed to load:", failures)
        setError(`Some data may be incomplete. ${failures.length} service(s) unavailable.`)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setError("Failed to load dashboard data. Please try refreshing the page.")
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
          <p className="text-gray-600">Overview of HR portal statistics and metrics</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Employee Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employees.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.employees.active} active, {stats.employees.inactive} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.attendance.presentCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.attendance.attendanceRate.toFixed(1)}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.attendance.absentCount}</div>
            <p className="text-xs text-muted-foreground">{stats.attendance.lateCount} late arrivals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teacher Files</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.files.totalFiles}</div>
            <p className="text-xs text-muted-foreground">{stats.files.pendingFiles} pending review</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employees by Department
            </CardTitle>
            <CardDescription>Distribution of employees across departments</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.employees.byDepartment).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No department data available</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.employees.byDepartment).map(([department, count]) => (
                  <div key={department} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{department}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Employee Categories
            </CardTitle>
            <CardDescription>Breakdown by employee type</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.employees.byCategory).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No category data available</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.employees.byCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Teacher Files Overview
          </CardTitle>
          <CardDescription>Status of teacher file submissions and requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.files.submittedFiles}</div>
              <p className="text-sm text-gray-600">Submitted</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.files.approvedFiles}</div>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.files.pendingFiles}</div>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.files.rejectedFiles}</div>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Requirements Completion</span>
              <span className="text-sm text-gray-600">
                {stats.files.completedRequirements} of {stats.files.totalRequirements} completed
              </span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width:
                    stats.files.totalRequirements > 0
                      ? `${(stats.files.completedRequirements / stats.files.totalRequirements) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
              <Users className="h-6 w-6" />
              <span>Manage Employees</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
              <Clock className="h-6 w-6" />
              <span>Mark Attendance</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent">
              <FileText className="h-6 w-6" />
              <span>Review Files</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
