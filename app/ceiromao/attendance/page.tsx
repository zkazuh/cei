"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { getAttendanceForDate, updateAttendanceStatus, getAttendanceStatsForDate } from "@/lib/attendance"
import { getEmployees } from "@/lib/employee-management"
import { getCurrentUser } from "@/lib/auth"
import type { Attendance, Employee } from "@/lib/supabase"
import { CalendarIcon, Users, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { format } from "date-fns"

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<"morning" | "afternoon">("morning")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0]
      const [attendanceData, employeesData, statsData] = await Promise.all([
        getAttendanceForDate(dateStr),
        getEmployees({ status: "active" }),
        getAttendanceStatsForDate(dateStr),
      ])

      setAttendance(attendanceData)
      setEmployees(employeesData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading attendance data:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceUpdate = async (employeeId: string, status: "present" | "absent" | "late") => {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to update attendance",
          variant: "destructive",
        })
        return
      }

      const dateStr = selectedDate.toISOString().split("T")[0]
      const success = await updateAttendanceStatus(employeeId, status, currentUser.id, dateStr, selectedPeriod)

      if (success) {
        toast({
          title: "Success",
          description: "Attendance updated successfully",
        })
        await loadData()
      } else {
        toast({
          title: "Error",
          description: "Failed to update attendance",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      })
    }
  }

  const getEmployeeAttendance = (employeeId: string) => {
    return attendance.find((att) => att.employee_id === employeeId && att.period === selectedPeriod)
  }

  const getStatusBadge = (status?: "present" | "absent" | "late") => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Present
          </Badge>
        )
      case "late":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Late
          </Badge>
        )
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Not Marked
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading attendance...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">Track daily employee attendance</p>
      </div>

      {/* Date and Period Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedPeriod} onValueChange={(value: "morning" | "afternoon") => setSelectedPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning</SelectItem>
            <SelectItem value="afternoon">Afternoon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.presentCount}</div>
            <p className="text-xs text-muted-foreground">Employees present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absentCount}</div>
            <p className="text-xs text-muted-foreground">Employees absent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Overall rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Attendance - {format(selectedDate, "PPP")} ({selectedPeriod})
          </CardTitle>
          <CardDescription>Mark attendance for each employee</CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active employees found.</div>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => {
                const employeeAttendance = getEmployeeAttendance(employee.id)
                return (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500">
                          {employee.employee_number} • {employee.department} • {employee.position}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getStatusBadge(employeeAttendance?.status)}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={employeeAttendance?.status === "present" ? "default" : "outline"}
                          onClick={() => handleAttendanceUpdate(employee.id, "present")}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={employeeAttendance?.status === "late" ? "default" : "outline"}
                          onClick={() => handleAttendanceUpdate(employee.id, "late")}
                        >
                          Late
                        </Button>
                        <Button
                          size="sm"
                          variant={employeeAttendance?.status === "absent" ? "default" : "outline"}
                          onClick={() => handleAttendanceUpdate(employee.id, "absent")}
                        >
                          Absent
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
