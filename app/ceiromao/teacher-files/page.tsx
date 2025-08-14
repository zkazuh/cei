"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Download,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  GraduationCap,
  Plus,
  RefreshCw,
} from "lucide-react"

export default function TeacherFilesPage() {
  const [requirements, setRequirements] = useState<MonthlyFileRequirementWithDetails[]>([])
  const [teachers, setTeachers] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    status: "all",
    employeeId: "all",
  })
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [requirementsData, teachersData] = await Promise.all([
        getMonthlyFileRequirements(
          filters.year,
          filters.month === 0 ? undefined : filters.month,
          filters.status === "all" ? undefined : filters.status,
          filters.employeeId === "all" ? undefined : filters.employeeId,
        ),
        getTeachers(),
      ])

      setRequirements(requirementsData)
      setTeachers(teachersData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher files data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters])

  const handleCreateRequirements = async () => {
    try {
      const success = await createMonthlyRequirements(filters.year, filters.month)
      if (success) {
        toast({
          title: "Success",
          description: "Monthly requirements created successfully",
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
    }
  }

  const handleUpdateOverdue = async () => {
    try {
      const success = await updateOverdueRequirements()
      if (success) {
        toast({
          title: "Success",
          description: "Overdue requirements updated successfully",
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
    }
  }

  const handleFileUpload = async (requirementId: string, employeeId: string, file: File) => {
    try {
      setUploading(requirementId)
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
      setUploading(null)
    }
  }

  const handleFileDownload = async (fileId: string) => {
    try {
      setDownloading(fileId)
      await downloadTeacherFile(fileId)
      toast({
        title: "Success",
        description: "File downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    } finally {
      setDownloading(null)
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
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return months[month - 1] || ""
  }

  const stats = {
    total: requirements.length,
    pending: requirements.filter((r) => r.status === "pending").length,
    submitted: requirements.filter((r) => r.status === "submitted").length,
    overdue: requirements.filter((r) => r.status === "overdue").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading teacher files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-purple-600" />
            Teacher Files
          </h1>
          <p className="text-muted-foreground">Manage monthly file submissions for teachers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateRequirements} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Requirements
          </Button>
          <Button onClick={handleUpdateOverdue} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Overdue
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Select
                value={filters.year.toString()}
                onValueChange={(value) => setFilters({ ...filters, year: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">Month</Label>
              <Select
                value={filters.month.toString()}
                onValueChange={(value) => setFilters({ ...filters, month: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {getMonthName(i + 1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
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
            <div>
              <Label htmlFor="teacher">Teacher</Label>
              <Select
                value={filters.employeeId}
                onValueChange={(value) => setFilters({ ...filters, employeeId: value })}
              >
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
      <div className="space-y-4">
        {requirements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Requirements Found</h3>
              <p className="text-muted-foreground mb-4">No monthly file requirements found for the selected filters.</p>
              <Button onClick={handleCreateRequirements}>
                <Plus className="w-4 h-4 mr-2" />
                Create Requirements
              </Button>
            </CardContent>
          </Card>
        ) : (
          requirements.map((requirement) => (
            <Card key={requirement.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{requirement.employee.name}</CardTitle>
                      <CardDescription>
                        {requirement.employee.employee_number} • {requirement.employee.position}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(requirement.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {getMonthName(requirement.month)} {requirement.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Due: {new Date(requirement.due_date).toLocaleDateString()}</span>
                    </div>
                    {requirement.submitted_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4" />
                        <span>Submitted: {new Date(requirement.submitted_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {requirement.status === "pending" ? (
                      <div>
                        <Label htmlFor={`file-${requirement.id}`} className="text-sm font-medium">
                          Upload File
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id={`file-${requirement.id}`}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(requirement.id, requirement.employee_id, file)
                              }
                            }}
                            disabled={uploading === requirement.id}
                          />
                          {uploading === requirement.id && (
                            <Button disabled size="sm">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : requirement.activity_file ? (
                      <div className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getFileIcon(requirement.activity_file.mime_type)}</span>
                            <div>
                              <p className="font-medium text-sm">{requirement.activity_file.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(requirement.activity_file.file_size)} •
                                {new Date(requirement.activity_file.upload_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFileDownload(requirement.activity_file!.id)}
                            disabled={downloading === requirement.activity_file!.id}
                          >
                            {downloading === requirement.activity_file!.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
