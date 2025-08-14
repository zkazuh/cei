"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  getTeacherFiles,
  getFileStats,
  updateFileStatus,
  uploadFile,
  downloadFile,
  createFileRequirement,
} from "@/lib/teacher-files"
import { getAllEmployees } from "@/lib/employee-management"
import { Upload, Download, Plus, Search, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
import type { TeacherFileWithEmployee, FileStats } from "@/lib/teacher-files"
import type { Employee } from "@/lib/supabase"

export default function TeacherFilesPage() {
  const [files, setFiles] = useState<TeacherFileWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState<FileStats>({
    total: 0,
    pending: 0,
    submitted: 0,
    overdue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [requirementFilter, setRequirementFilter] = useState<string>("all")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isRequirementDialogOpen, setIsRequirementDialogOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    employeeId: "",
    requirementType: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    file: null as File | null,
  })
  const [requirementForm, setRequirementForm] = useState({
    employeeId: "",
    fileName: "",
    requirementType: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    dueDate: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [filesData, statsData, employeesData] = await Promise.all([
        getTeacherFiles(),
        getFileStats(),
        getAllEmployees(),
      ])

      setFiles(filesData)
      setStats(statsData)
      setEmployees(employeesData.filter((emp) => emp.category === "teacher"))
    } catch (error) {
      console.error("Error loading teacher files data:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher files data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.employees.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.requirement_type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || file.status === statusFilter
    const matchesRequirement = requirementFilter === "all" || file.requirement_type === requirementFilter

    return matchesSearch && matchesStatus && matchesRequirement
  })

  const handleStatusUpdate = async (fileId: string, newStatus: string) => {
    try {
      const success = await updateFileStatus(fileId, newStatus)
      if (success) {
        await loadData()
        toast({
          title: "Success",
          description: "File status updated successfully",
        })
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update file status",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadForm.file || !uploadForm.employeeId || !uploadForm.requirementType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const filePath = await uploadFile(
        uploadForm.file,
        uploadForm.employeeId,
        uploadForm.requirementType,
        uploadForm.month,
        uploadForm.year,
      )

      if (filePath) {
        await loadData()
        setIsUploadDialogOpen(false)
        setUploadForm({
          employeeId: "",
          requirementType: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          file: null,
        })
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    }
  }

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !requirementForm.employeeId ||
      !requirementForm.fileName ||
      !requirementForm.requirementType ||
      !requirementForm.dueDate
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await createFileRequirement({
        employee_id: requirementForm.employeeId,
        file_name: requirementForm.fileName,
        requirement_type: requirementForm.requirementType,
        month: requirementForm.month,
        year: requirementForm.year,
        due_date: requirementForm.dueDate,
        status: "pending",
      })

      if (success) {
        await loadData()
        setIsRequirementDialogOpen(false)
        setRequirementForm({
          employeeId: "",
          fileName: "",
          requirementType: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          dueDate: "",
        })
        toast({
          title: "Success",
          description: "File requirement created successfully",
        })
      } else {
        throw new Error("Failed to create requirement")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create file requirement",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const blob = await downloadFile(filePath)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Success",
          description: "File downloaded successfully",
        })
      } else {
        throw new Error("Download failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string, dueDate?: string) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === "pending"

    if (isOverdue) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading teacher files...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Files</h1>
          <p className="text-gray-600">Manage teacher file requirements and submissions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isRequirementDialogOpen} onOpenChange={setIsRequirementDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Requirement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create File Requirement</DialogTitle>
                <DialogDescription>Create a new file requirement for a teacher</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRequirement} className="space-y-4">
                <div>
                  <Label htmlFor="req-employee">Teacher</Label>
                  <Select
                    value={requirementForm.employeeId}
                    onValueChange={(value) => setRequirementForm((prev) => ({ ...prev, employeeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.employee_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="req-filename">File Name</Label>
                  <Input
                    id="req-filename"
                    value={requirementForm.fileName}
                    onChange={(e) => setRequirementForm((prev) => ({ ...prev, fileName: e.target.value }))}
                    placeholder="Enter file name"
                  />
                </div>
                <div>
                  <Label htmlFor="req-type">Requirement Type</Label>
                  <Select
                    value={requirementForm.requirementType}
                    onValueChange={(value) => setRequirementForm((prev) => ({ ...prev, requirementType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select requirement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                      <SelectItem value="activity_report">Activity Report</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="attendance_sheet">Attendance Sheet</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="req-month">Month</Label>
                    <Select
                      value={requirementForm.month.toString()}
                      onValueChange={(value) =>
                        setRequirementForm((prev) => ({ ...prev, month: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(0, i).toLocaleString("default", { month: "long" })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="req-year">Year</Label>
                    <Input
                      id="req-year"
                      type="number"
                      value={requirementForm.year}
                      onChange={(e) =>
                        setRequirementForm((prev) => ({ ...prev, year: Number.parseInt(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="req-due-date">Due Date</Label>
                  <Input
                    id="req-due-date"
                    type="date"
                    value={requirementForm.dueDate}
                    onChange={(e) => setRequirementForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsRequirementDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Requirement</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
                <DialogDescription>Upload a file for a teacher requirement</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="upload-employee">Teacher</Label>
                  <Select
                    value={uploadForm.employeeId}
                    onValueChange={(value) => setUploadForm((prev) => ({ ...prev, employeeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.employee_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="upload-type">Requirement Type</Label>
                  <Select
                    value={uploadForm.requirementType}
                    onValueChange={(value) => setUploadForm((prev) => ({ ...prev, requirementType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select requirement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                      <SelectItem value="activity_report">Activity Report</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="attendance_sheet">Attendance Sheet</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="upload-month">Month</Label>
                    <Select
                      value={uploadForm.month.toString()}
                      onValueChange={(value) => setUploadForm((prev) => ({ ...prev, month: Number.parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(0, i).toLocaleString("default", { month: "long" })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="upload-year">Year</Label>
                    <Input
                      id="upload-year"
                      type="number"
                      value={uploadForm.year}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, year: Number.parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="upload-file">File</Label>
                  <Input
                    id="upload-file"
                    type="file"
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Upload File</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={requirementFilter} onValueChange={setRequirementFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Requirement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                <SelectItem value="activity_report">Activity Report</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="attendance_sheet">Attendance Sheet</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Files</CardTitle>
          <CardDescription>Manage teacher file requirements and submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{file.employees.name}</div>
                      <div className="text-sm text-gray-500">{file.employees.employee_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>{file.file_name}</TableCell>
                  <TableCell className="capitalize">{file.requirement_type.replace("_", " ")}</TableCell>
                  <TableCell>
                    {file.month}/{file.year}
                  </TableCell>
                  <TableCell>{file.due_date ? new Date(file.due_date).toLocaleDateString() : "No due date"}</TableCell>
                  <TableCell>{getStatusBadge(file.status, file.due_date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {file.file_path && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file.file_path!, file.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Select value={file.status} onValueChange={(value) => handleStatusUpdate(file.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredFiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">No files found matching your criteria</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
