"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import {
  getMonthlyFileRequirements,
  createCurrentMonthRequirements,
  updateRequirementStatus,
  markOverdueRequirements,
  getTeacherFileStats,
  uploadTeacherFile,
} from "@/lib/teacher-files"
import type { MonthlyFileRequirementWithEmployee } from "@/lib/supabase"
import { GraduationCap, FileText, Clock, CheckCircle, AlertCircle, Plus, Download } from "lucide-react"
import { format } from "date-fns"

export default function TeacherFilesPage() {
  const [requirements, setRequirements] = useState<MonthlyFileRequirementWithEmployee[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, submitted: 0, overdue: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    status: "all",
  })
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Mark overdue requirements first
      await markOverdueRequirements()

      // Load requirements with filters
      const filterParams: any = {
        year: filters.year,
        month: filters.month,
      }

      if (filters.status !== "all") {
        filterParams.status = filters.status
      }

      // If user is a teacher, only show their requirements
      if (user?.role === "teacher") {
        // In a real app, you'd get the employee_id from the user
        // For now, we'll show all requirements
      }

      const data = await getMonthlyFileRequirements(filterParams)
      setRequirements(data)

      // Load stats for current month
      const statsData = await getTeacherFileStats()
      setStats(statsData)
    } catch (error) {
      console.error("Error loading teacher files data:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher files data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCurrentMonth = async () => {
    try {
      const success = await createCurrentMonthRequirements()
      if (success) {
        toast({
          title: "Success",
          description: "Monthly file requirements created for all teachers",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: "Failed to create monthly requirements",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while creating requirements",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (requirementId: string, employeeId: string, file: File) => {
    setUploadingFile(requirementId)
    try {
      const uploadedFile = await uploadTeacherFile(employeeId, file)
      if (uploadedFile) {
        const success = await updateRequirementStatus(requirementId, "submitted", uploadedFile.id)
        if (success) {
          toast({
            title: "Success",
            description: "File uploaded successfully",
          })
          loadData()
        } else {
          toast({
            title: "Error",
            description: "File uploaded but failed to update requirement status",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while uploading file",
        variant: "destructive",
      })
    } finally {
      setUploadingFile(null)
    }
  }

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === "pending"

    if (isOverdue || status === "overdue") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      )
    }

    switch (status) {
      case "submitted":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Submitted
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Employee", "Month", "Year", "Due Date", "Status", "Submitted At"].join(","),
      ...requirements.map((req) =>
        [
          req.employee?.name || "Unknown",
          req.month,
          req.year,
          req.due_date,
          req.status,
          req.submitted_at || "Not submitted",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `teacher-files-${filters.year}-${filters.month}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Teacher Files
          </h1>
          <p className="text-muted-foreground">Manage monthly file submissions for teachers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleCreateCurrentMonth}>
            <Plus className="h-4 w-4 mr-2" />
            Create Current Month
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">Completed on time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select
                value={filters.year.toString()}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, year: Number.parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={filters.month.toString()}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, month: Number.parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2024, month - 1, 1), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadData} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements List */}
      <Card>
        <CardHeader>
          <CardTitle>File Requirements</CardTitle>
          <CardDescription>Monthly file submission requirements for teachers</CardDescription>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No file requirements found for the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requirements.map((requirement) => (
                <div key={requirement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{requirement.employee?.name || "Unknown Teacher"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(requirement.year, requirement.month - 1, 1), "MMMM yyyy")} - Due:{" "}
                        {format(new Date(requirement.due_date), "MMM dd, yyyy")}
                      </p>
                      {requirement.submitted_at && (
                        <p className="text-xs text-green-600">
                          Submitted: {format(new Date(requirement.submitted_at), "MMM dd, yyyy HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {getStatusBadge(requirement.status, requirement.due_date)}

                    {requirement.status === "pending" && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && requirement.employee) {
                              handleFileUpload(requirement.id, requirement.employee.id, file)
                            }
                          }}
                          disabled={uploadingFile === requirement.id}
                          className="w-48"
                        />
                        {uploadingFile === requirement.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        )}
                      </div>
                    )}

                    {requirement.file && (
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View File
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
