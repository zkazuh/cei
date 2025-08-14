"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { Users, Calendar, FileText, BarChart3, GraduationCap } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    {
      title: "Total Employees",
      value: "156",
      description: "Active employees",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Present Today",
      value: "142",
      description: "91% attendance rate",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Pending Files",
      value: "23",
      description: "Teacher submissions",
      icon: GraduationCap,
      color: "text-purple-600",
    },
    {
      title: "Activity Hours",
      value: "1,247",
      description: "This month",
      icon: FileText,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}! Here's what's happening at Ceiromao today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Attendance
            </CardTitle>
            <CardDescription>Quick overview of today's attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Present</span>
                <span className="text-sm font-medium">142 employees</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Absent</span>
                <span className="text-sm font-medium">8 employees</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Late</span>
                <span className="text-sm font-medium">6 employees</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Teacher Files Status
            </CardTitle>
            <CardDescription>Monthly file submission status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Submitted</span>
                <span className="text-sm font-medium text-green-600">12 files</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium text-yellow-600">23 files</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Overdue</span>
                <span className="text-sm font-medium text-red-600">3 files</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest updates and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Maria Silva submitted monthly report</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New employee Carlos Santos added</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Attendance report generated</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
