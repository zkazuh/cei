"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  getMonthlyFileRequirements,
  getTeachers,
  createMonthlyRequirements,
  updateOverdueRequirements,
  uploadTeacherFile,
  downloadTeacherFile,
  formatFileSize,
  getFileIcon,
  type MonthlyFileRequirementWithDetails,
} from "@/lib/teacher-files"
import type { Employee } from "@/lib/supabase"
import {
  GraduationCap,
  Upload,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  FileText,
  Users,
  Loader2,
} from "lucide-react"

export default function TeacherFilesPage() {
  const [requirements, setRequirements] = useState<MonthlyFileRequirementWithDetails[]>([])
  const [teachers, setTeachers] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")

  // Create requirements form
  const [createYear, setCreateYear] = useState<string>(new Date().getFullYear().toString())
  const [createMonth, setCreateMonth] = useState<string>((new Date().getMonth() + 1).toString())

  const { toast } = useToast()

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i
    return { value: year.toString(), label: year.toString() }
  })

  useEffect(() => {
    loadData()
  }, [selectedYear, selectedMonth, selectedStatus, selectedEmployee])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [requirementsData, teachersData] = await Promise.all([
        getMonthlyFileRequirements(
          selectedYear !== "all" ? Number.parseInt(selectedYear) : undefined,
          selectedMonth !== "all" ? Number.parseInt(selectedMonth) : undefined,
          selectedStatus,
          selectedEmployee !== "all" ? selectedEmployee : undefined,
        ),
        getTeachers(),
      ])

      setRequirements(requirementsData)
      setTeachers(teachersData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load teacher files data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRequirements = async () => {
    setIsCreating(true)
    try {
      const success = await createMonthlyRequirements(Number.parseInt(createYear), Number.parseInt(createMonth))
      if (success) {
        toast({
          title: "Success",
          description: "Monthly requirements created for all teachers",
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
        description: "Failed to create monthly requirements",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateOverdue = async () => {
    setIsUpdating(true)
    try {
      const success = await updateOverdueRequirements()
      if (success) {
        toast({
          title: "Success",
          description: "Overdue requirements updated",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: "Failed to update overdue requirements",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update overdue requirements",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFileUpload = async (requirementId: string, employeeId: string, file: File) => {
    setIsUploading(requirementId)
    try {
      const success = await uploadTeacherFile(requirementId, file, employeeId)
      if (success) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        loadData()
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
        description: "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(null)
    }
  }

  const handleFileDownload = async (fileId: string, fileName: string) => {
    setIsDownloading(fileId)
    try {
      await downloadTeacherFile(fileId)
      toast({
        title: "Success",
        description: `Downloaded ${fileName}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Submitted
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const stats = {
    total: requirements.length,
    pending: requirements.filter((r) => r.status === "pending").length,
    submitted: requirements.filter((r) => r.status === "submitted").length,
    overdue: requirements.filter((r) => r.status === "overdue").length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-purple-600" />
            Teacher Files
          </h1>
          <p className="text-muted-foreground">Manage monthly file submissions for teachers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleUpdateOverdue} disabled={isUpdating} variant="outline">
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Update Overdue
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Requirements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Monthly Requirements
          </CardTitle>
          <CardDescription>Create file submission requirements for all teachers for a specific month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="create-year">Year</Label>
              <Select value={createYear} onValueChange={setCreateYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="create-month">Month</Label>
              <Select value={createMonth} onValueChange={setCreateMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateRequirements} disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Requirements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="employee">Teacher</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements List */}
      <div className="grid gap-4">
        {requirements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Requirements Found</h3>
              <p className="text-muted-foreground text-center">
                No monthly file requirements match your current filters. Try adjusting the filters or create new
                requirements.
              </p>
            </CardContent>
          </Card>
        ) : (
          requirements.map((requirement) => (
            <Card key={requirement.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{requirement.employee.name}</CardTitle>
                      <CardDescription>
                        {months.find((m) => m.value === requirement.month.toString())?.label} {requirement.year}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(requirement.status)}
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Teacher
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {new Date(requirement.due_date).toLocaleDateString()}
                    </div>
                    {requirement.submitted_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Submitted: {new Date(requirement.submitted_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {requirement.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileUpload(requirement.id, requirement.employee_id, file)
                          }
                        }}
                        disabled={isUploading === requirement.id}
                        className="flex-1"
                      />
                      <Button
                        disabled={isUploading === requirement.id}
                        onClick={() => {
                          const input = document.createElement("input")
                          input.type = "file"
                          input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                              handleFileUpload(requirement.id, requirement.employee_id, file)
                            }
                          }
                          input.click()
                        }}
                      >
                        {isUploading === requirement.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload File
                      </Button>
                    </div>
                  ) : requirement.activity_file ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(requirement.activity_file.mime_type)}</span>
                          <div>
                            <p className="font-medium">{requirement.activity_file.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(requirement.activity_file.file_size)} • Uploaded{" "}
                              {new Date(requirement.activity_file.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleFileDownload(requirement.activity_file!.id, requirement.activity_file!.filename)
                          }
                          disabled={isDownloading === requirement.activity_file!.id}
                        >
                          {isDownloading === requirement.activity_file!.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
