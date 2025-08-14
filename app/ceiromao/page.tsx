"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"
import { getAttendanceStats } from "@/lib/attendance"
import { getActivityFileStats } from "@/lib/activity-files"

interface Stats {
  totalEmployees: number
  presentToday: number
  pendingFiles: number
  approvedFiles: number
  attendanceRate: number
}

const quickActions = [
  {
    name: "Mark Attendance",
    description: "Update employee attendance for today",
    href: "/ceiromao/attendance",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    name: "Activity Hours",
    description: "Submit or review activity hour files",
    href: "/ceiromao/activity-hours",
    icon: Clock,
    color: "bg-green-500",
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    presentToday: 0,
    pendingFiles: 0,
    approvedFiles: 0,
    attendanceRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [attendanceStats, fileStats] = await Promise.all([getAttendanceStats(), getActivityFileStats()])

        setStats({
          totalEmployees: attendanceStats.totalEmployees,
          presentToday: attendanceStats.presentToday,
          pendingFiles: fileStats.pendingFiles,
          approvedFiles: fileStats.approvedFiles,
          attendanceRate: attendanceStats.attendanceRate,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statsCards = [
    {
      name: "Total Employees",
      value: stats.totalEmployees.toString(),
      icon: Users,
      change: "Active employees",
      changeType: "neutral",
    },
    {
      name: "Present Today",
      value: stats.presentToday.toString(),
      icon: TrendingUp,
      change: `${stats.attendanceRate}% attendance`,
      changeType: "positive",
    },
    {
      name: "Files Pending",
      value: stats.pendingFiles.toString(),
      icon: Clock,
      change: "Awaiting review",
      changeType: "neutral",
    },
    {
      name: "Files Approved",
      value: stats.approvedFiles.toString(),
      icon: FileText,
      change: "This month",
      changeType: "positive",
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="mt-2 text-gray-600">Here's what's happening with your HR operations today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stat.value}</dd>
                    <dd className="text-sm text-gray-600">{stat.change}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions - keep existing code */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <CardTitle className="text-lg">{action.name}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your HR system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">System connected to Supabase database</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Real-time data synchronization active</p>
                <p className="text-xs text-gray-500">1 minute ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Database tables initialized</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
