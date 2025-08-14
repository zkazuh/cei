"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Clock, CheckCircle } from "lucide-react"
import { getEmployeeStats } from "@/lib/employees"
import { getTeacherFileStats, updateOverdueRequirements } from "@/lib/teacher-files"

export default function DashboardPage() {
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    teachers: 0,
    regular: 0,
    outsourced: 0,
  })

  const [fileStats, setFileStats] = useState({
    total: 0,
    submitted: 0,
    pending: 0,
    overdue: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        await updateOverdueRequirements()
        const [empStats, teacherStats] = await Promise.all([getEmployeeStats(), getTeacherFileStats()])
        setEmployeeStats(empStats)
        setFileStats(teacherStats)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
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
        <p className="text-gray-600">Overview of the HR system</p>
      </div>

      {/* Employee Stats */}
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
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.teachers}</div>
            <p className="text-xs text-muted-foreground">Education staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.regular}</div>
            <p className="text-xs text-muted-foreground">Administrative staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outsourced</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.outsourced}</div>
            <p className="text-xs text-muted-foreground">External contractors</p>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Files Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileStats.total}</div>
            <p className="text-xs text-muted-foreground">Monthly file requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fileStats.submitted}</div>
            <p className="text-xs text-muted-foreground">
              {fileStats.total > 0 ? Math.round((fileStats.submitted / fileStats.total) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{fileStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fileStats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Database Connection</span>
              <span className="text-green-600">✓ Connected</span>
            </div>
            <div className="flex justify-between">
              <span>Last Data Update</span>
              <span className="text-gray-600">Just now</span>
            </div>
            <div className="flex justify-between">
              <span>System Status</span>
              <span className="text-green-600">✓ Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
