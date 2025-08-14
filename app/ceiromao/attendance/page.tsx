"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Users, Clock, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  getAttendanceForDate,
  updateAttendanceStatus,
  addAttendanceJustification,
  getAttendanceStatsForDate,
} from "@/lib/attendance"
import { getEmployees } from "@/lib/employees"
import type { Attendance, Employee } from "@/lib/supabase"
import { format } from "date-fns"

interface AttendanceWithEmployee extends Attendance {
  employees: Employee & {
    users: { name: string; email: string }
  }
}

interface EmployeeAttendanceData {
  employee: Employee & { users: { name: string; email: string } }
  morning?: AttendanceWithEmployee
  afternoon?: AttendanceWithEmployee
}

export default function AttendancePage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [attendanceData, setAttendanceData] = useState<AttendanceWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceWithEmployee | null>(null)
  const [justification, setJustification] = useState("")
  const [justificationType, setJustificationType] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    lateCount: 0,
  })

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const dateStr = selectedDate.toISOString().split("T")[0]

      const [attendanceResult, employeesResult, statsResult] = await Promise.all([
        getAttendanceForDate(dateStr),
        getEmployees(),
        getAttendanceStatsForDate(dateStr),
      ])

      setAttendanceData(attendanceResult as AttendanceWithEmployee[])
      setEmployees(employeesResult)
      setStats(statsResult)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load attendance data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAttendance = async (attendance: AttendanceWithEmployee) => {
    if (user?.role !== "admin") return

    setIsUpdating(attendance.id)
    const newStatus = attendance.status === "present" ? "absent" : "present"
    const dateStr = selectedDate.toISOString().split("T")[0]

    try {
      const success = await updateAttendanceStatus(
        attendance.employee_id,
        newStatus,
        user.id,
        dateStr,
        attendance.period,
      )

      if (success) {
        // Update local state
        setAttendanceData((prev) => prev.map((att) => (att.id === attendance.id ? { ...att, status: newStatus } : att)))

        // Refresh stats
        await fetchData()

        toast({
          title: "Attendance Updated",
          description: `${attendance.employees.users.name} marked as ${newStatus} for ${attendance.period} on ${format(selectedDate, "PPP")}.`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update attendance. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleAttendanceForEmployee = async (
    employee: Employee,
    status: "present" | "absent",
    period: "morning" | "afternoon",
  ) => {
    if (user?.role !== "admin") return

    const dateStr = selectedDate.toISOString().split("T")[0]
    setIsUpdating(`${employee.id}-${period}`)

    try {
      const success = await updateAttendanceStatus(employee.id, status, user.id, dateStr, period)

      if (success) {
        // Refresh data to get the new attendance record
        await fetchData()

        toast({
          title: "Attendance Updated",
          description: `${employee.users?.name} marked as ${status} for ${period} on ${format(selectedDate, "PPP")}.`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update attendance. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attendance. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleJustificationSubmit = async () => {
    if (!selectedAttendance || !justification.trim() || !justificationType) return

    try {
      const success = await addAttendanceJustification(
        selectedAttendance.id,
        justificationType as any,
        justification.trim(),
        user!.id,
      )

      if (success) {
        // Update local state
        setAttendanceData((prev) =>
          prev.map((att) =>
            att.id === selectedAttendance.id
              ? {
                  ...att,
                  attendance_justifications: [
                    {
                      id: "temp",
                      attendance_id: att.id,
                      justification_type: justificationType as any,
                      justification_text: justification.trim(),
                      created_by: user!.id,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                  ],
                }
              : att,
          ),
        )

        setIsDialogOpen(false)
        setJustification("")
        setJustificationType("")
        setSelectedAttendance(null)

        toast({
          title: "Justification Added",
          description: "Absence justification has been recorded successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add justification. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add justification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const openJustificationDialog = (attendance: AttendanceWithEmployee) => {
    setSelectedAttendance(attendance)
    const existingJustification = attendance.attendance_justifications?.[0]
    setJustification(existingJustification?.justification_text || "")
    setJustificationType(existingJustification?.justification_type || "")
    setIsDialogOpen(true)
  }

  // Group attendance data by employee
  const groupedAttendance: EmployeeAttendanceData[] = employees.map((employee) => {
    const morning = attendanceData.find((att) => att.employee_id === employee.id && att.period === "morning")
    const afternoon = attendanceData.find((att) => att.employee_id === employee.id && att.period === "afternoon")

    return {
      employee: employee as Employee & { users: { name: string; email: string } },
      morning,
      afternoon,
    }
  })

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Attendance
        </h1>
        <p className="text-muted-foreground">Track and manage employee attendance records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Employees present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.presentCount}</div>
            <p className="text-xs text-muted-foreground">Punctual arrivals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lateCount}</div>
            <p className="text-xs text-muted-foreground">Late today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absentCount}</div>
            <p className="text-xs text-muted-foreground">Not present</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Management</CardTitle>
          <CardDescription>Attendance tracking features will be implemented here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Attendance management coming soon...</p>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance - {format(selectedDate, "PPP")}</CardTitle>
          <CardDescription>
            Morning and afternoon periods • Click on status badges to update attendance (Admin only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedAttendance.map((employeeData) => {
              const { employee, morning, afternoon } = employeeData
              const isUpdatingMorning = isUpdating === (morning?.id || `${employee.id}-morning`)
              const isUpdatingAfternoon = isUpdating === (afternoon?.id || `${employee.id}-afternoon`)

              return (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{employee.users?.name}</h3>
                    <p className="text-sm text-gray-500">{employee.users?.email}</p>
                    <p className="text-xs text-gray-400">
                      {employee.department} • {employee.position}
                    </p>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Morning Period */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-medium">Morning</span>
                      </div>

                      {isUpdatingMorning ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-1">
                          {morning ? (
                            <Badge
                              variant={morning.status === "present" ? "default" : "destructive"}
                              className={`cursor-pointer text-xs ${user?.role === "admin" ? "hover:opacity-80" : "cursor-not-allowed"}`}
                              onClick={() => toggleAttendance(morning)}
                            >
                              {morning.status === "present" ? "Present" : "Absent"}
                            </Badge>
                          ) : (
                            user?.role === "admin" && (
                              <div className="flex flex-col space-y-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent text-xs px-2 py-1 h-6"
                                  onClick={() => handleAttendanceForEmployee(employee, "present", "morning")}
                                >
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent text-xs px-2 py-1 h-6"
                                  onClick={() => handleAttendanceForEmployee(employee, "absent", "morning")}
                                >
                                  Absent
                                </Button>
                              </div>
                            )
                          )}

                          {morning?.status === "absent" && (
                            <Dialog
                              open={isDialogOpen && selectedAttendance?.id === morning.id}
                              onOpenChange={setIsDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs px-2 py-1 h-6 bg-transparent"
                                  onClick={() => openJustificationDialog(morning)}
                                  disabled={user?.role !== "admin"}
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {morning.attendance_justifications?.[0] ? "Edit" : "Add"}
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                          )}

                          {morning?.attendance_justifications?.[0] && (
                            <Badge variant="outline" className="text-xs">
                              {morning.attendance_justifications[0].justification_type.replace("_", " ")}
                            </Badge>
                          )}

                          {!morning && user?.role !== "admin" && (
                            <Badge variant="outline" className="text-xs">
                              Not Marked
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Afternoon Period */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-medium">Afternoon</span>
                      </div>

                      {isUpdatingAfternoon ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-1">
                          {afternoon ? (
                            <Badge
                              variant={afternoon.status === "present" ? "default" : "destructive"}
                              className={`cursor-pointer text-xs ${user?.role === "admin" ? "hover:opacity-80" : "cursor-not-allowed"}`}
                              onClick={() => toggleAttendance(afternoon)}
                            >
                              {afternoon.status === "present" ? "Present" : "Absent"}
                            </Badge>
                          ) : (
                            user?.role === "admin" && (
                              <div className="flex flex-col space-y-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent text-xs px-2 py-1 h-6"
                                  onClick={() => handleAttendanceForEmployee(employee, "present", "afternoon")}
                                >
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent text-xs px-2 py-1 h-6"
                                  onClick={() => handleAttendanceForEmployee(employee, "absent", "afternoon")}
                                >
                                  Absent
                                </Button>
                              </div>
                            )
                          )}

                          {afternoon?.status === "absent" && (
                            <Dialog
                              open={isDialogOpen && selectedAttendance?.id === afternoon.id}
                              onOpenChange={setIsDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs px-2 py-1 h-6 bg-transparent"
                                  onClick={() => openJustificationDialog(afternoon)}
                                  disabled={user?.role !== "admin"}
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {afternoon.attendance_justifications?.[0] ? "Edit" : "Add"}
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                          )}

                          {afternoon?.attendance_justifications?.[0] && (
                            <Badge variant="outline" className="text-xs">
                              {afternoon.attendance_justifications[0].justification_type.replace("_", " ")}
                            </Badge>
                          )}

                          {!afternoon && user?.role !== "admin" && (
                            <Badge variant="outline" className="text-xs">
                              Not Marked
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Justification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Absence Justification</DialogTitle>
            <DialogDescription>
              Add or update justification for {selectedAttendance?.employees?.users?.name}'s absence on{" "}
              {format(selectedDate, "PPP")} ({selectedAttendance?.period})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Justification Type</Label>
              <Select value={justificationType} onValueChange={setJustificationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select justification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical Leave</SelectItem>
                  <SelectItem value="justified">Justified Absence</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="recess">Recess</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="banked_hours">Banked Hours</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="justification">Justification Details</Label>
              <Textarea
                id="justification"
                placeholder="Enter justification details..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleJustificationSubmit} disabled={!justification.trim() || !justificationType}>
              Save Justification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
