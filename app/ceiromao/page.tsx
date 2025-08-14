"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getEmployeeStats } from "@/lib/employee-management"
import { getFileStats } from "@/lib/teacher-files"
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react"

export default function DashboardPage() {
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byCategory: {} as Record<string, number>,
    byDepartment: {} as Record<string, number>,
  })
  const [fileStats, setFileStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    overdue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [empStats, fStats] = await Promise.all([getEmployeeStats(), getFileStats()])
      setEmployeeStats(empStats)
      setFileStats(fStats)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your HR system</p>
      </div>

      {/* Employee Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Employee Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeStats.total}</div>
              <p className="text-xs text-muted-foreground">All employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{employeeStats.active}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{employeeStats.inactive}</div>
              <p className="text-xs text-muted-foreground">Not currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{employeeStats.byCategory.teacher || 0}</div>
              <p className="text-xs text-muted-foreground">Teaching staff</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Teacher Files Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fileStats.total}</div>
              <p className="text-xs text-muted-foreground">All file requirements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{fileStats.submitted}</div>
              <p className="text-xs text-muted-foreground">Files submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{fileStats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting submission</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{fileStats.overdue}</div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Department Breakdown */}
      {Object.keys(employeeStats.byDepartment).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Department Breakdown
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(employeeStats.byDepartment).map(([department, count]) => (
              <Card key={department}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{department}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">employees</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
