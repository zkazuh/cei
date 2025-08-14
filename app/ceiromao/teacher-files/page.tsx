"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useToast } from "@/hooks/use-toast"
import {
  getTeacherFiles,
  getFileStats,
  updateFileStatus,
  uploadFile,
  downloadFile,
  createFileRequirement,
} from "@/lib/teacher-files"
import { getEmployees } from "@/lib/employee-management"
import type { ActivityFile, Employee } from "@/lib/supabase"
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Plus,
} from "lucide-react"

interface TeacherFileWithEmployee extends ActivityFile {
  employees: Employee
}

export default function TeacherFilesPage() {
  const [files, setFiles] = useState<TeacherFileWithEmployee[]>([])
  const [filteredFiles, setFilteredFiles] = useState<TeacherFileWithEmployee[]>([])
  const [teachers, setTeachers] = useState<Employee[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    overdue: 0,
  })
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    requirementType: "all",
  })
  const [loading, setLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isCreateRequirementDialogOpen, setIsCreateRequirementDialogOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [requirementType, setRequirementType] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterFiles()
  }, [files, filters])

  const loadData = async () => {
    try {
      const [filesData, statsData, teachersData] = await Promise.all([
        getTeacherFiles(),
        getFileStats(),
        getEmployees({ category: "teacher" }),
      ])
      setFiles(filesData)
      setStats(statsData)
      setTeachers(teachersData)
    } catch (error) {
      console.error("Error loading teacher files:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterFiles = () => {
    let filtered = files

    if (filters.search) {
      filtered = filtered.filter(
        (file) =>
          file.file_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          file.employees.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          file.requirement_type.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    if (filters.status !== "all") {
      if (filters.status === "overdue") {
        const now = new Date()
        filtered = filtered.filter(
          (file) => file.status === "pending" && file.due_date && new Date(file.due_date) < now,
        )
      } else {
        filtered = filtered.filter((file) => file.status === filters.status)
      }
    }

    if (filters.requirementType !== "all") {
      filtered = filtered.filter((file) => file.requirement_type === filters.requirementType)
    }

    setFilteredFiles(filtered)
  }

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
        toast({
          title: "Error",
          description: "Failed to update file status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update file status",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async () => {
    if (!uploadingFile || !selectedEmployee || !requirementType || !selectedMonth || !selectedYear) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const filePath = await uploadFile(
        uploadingFile,
        selectedEmployee,
        requirementType,
        Number.parseInt(selectedMonth),
        Number.parseInt(selectedYear),
      )
      if (filePath) {
        // Create file record in database
        const dueDate = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth), 10)
          .toISOString()
          .split("T")[0]
        await createFileRequirement({
          employee_id: selectedEmployee,
          file_name: uploadingFile.name,
          file_path: filePath,
          file_size: uploadingFile.size,
          file_type: uploadingFile.type,
          requirement_type: requirementType,
          month: Number.parseInt(selectedMonth),
          year: Number.parseInt(selectedYear),
          due_date: dueDate,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })

        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        setIsUploadDialogOpen(false)
        setUploadingFile(null)
        setSelectedEmployee("")
        setRequirementType("")
        setSelectedMonth("")
        setSelectedYear("")
        await loadData()
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
    }
  }

  const handleFileDownload = async (file: TeacherFileWithEmployee) => {
    try {
      if (file.file_path) {
        const blob = await downloadFile(file.file_path)
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = file.file_name
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          toast({
            title: "Error",
            description: "Failed to download file",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "File not available for download",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const handleCreateRequirement = async () => {
    if (!selectedEmployee || !requirementType || !selectedMonth || !selectedYear) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const dueDate = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth), 10)
        .toISOString()
        .split("T")[0]
      const fileName = `${requirementType}_${selectedMonth}_${selectedYear}.pdf`

      const success = await createFileRequirement({
        employee_id: selectedEmployee,
        file_name: fileName,
        requirement_type: requirementType,
        month: Number.parseInt(selectedMonth),
        year: Number.parseInt(selectedYear),
        due_date: dueDate,
        status: "pending",
      })

      if (success) {
        toast({
          title: "Success",
          description: "File requirement created successfully",
        })
        setIsCreateRequirementDialogOpen(false)
        setSelectedEmployee("")
        setRequirementType("")
        setSelectedMonth("")
        setSelectedYear("")
        await loadData()
      } else {
        toast({
          title: "Error",
          description: "Failed to create file requirement",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create file requirement",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (file: TeacherFileWithEmployee) => {
    const now = new Date()
    const isOverdue = file.status === "pending" && file.due_date && new Date(file.due_date) < now

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Overdue
        </Badge>
      )
    }

    switch (file.status) {
      case "submitted":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
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
        return <Badge variant="outline">{file.status}</Badge>
    }
  }

  const getRequirementTypes = () => {
    const types = [...new Set(files.map((file) => file.requirement_type))]
    return types.sort()
  }

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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

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
          <Dialog open={isCreateRequirementDialogOpen} onOpenChange={setIsCreateRequirementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Requirement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create File Requirement</DialogTitle>
                <DialogDescription>Create a new file requirement for a teacher</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="req_teacher">Teacher</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req_requirement_type">Requirement Type</Label>
                  <Input
                    id="req_requirement_type"
                    value={requirementType}
                    onChange={(e) => setRequirementType(e.target.value)}
                    placeholder="e.g., Monthly Activity Report"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="req_month">Month</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
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
                  <div className="space-y-2">
                    <Label htmlFor="req_year">Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateRequirementDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRequirement}>Create Requirement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Teacher File</DialogTitle>
                <DialogDescription>Upload a file for a teacher's monthly requirement</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher">Teacher</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirement_type">Requirement Type</Label>
                  <Input
                    id="requirement_type"
                    value={requirementType}
                    onChange={(e) => setRequirementType(e.target.value)}
                    placeholder="e.g., Monthly Activity Report"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
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
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadingFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleFileUpload}>Upload File</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All file requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">Completed submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
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
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files or teachers..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.requirementType}
              onValueChange={(value) => setFilters({ ...filters, requirementType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Requirement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {getRequirementTypes().map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Requirements ({filteredFiles.length})
          </CardTitle>
          <CardDescription>
            {filters.search || filters.status !== "all" || filters.requirementType !== "all"
              ? "Filtered results"
              : "All file requirements"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No files found matching the current filters.</div>
          ) : (
            <div className="space-y-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">{file.file_name}</h3>
                        <p className="text-sm text-gray-500">{file.requirement_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {file.employees.name}
                      </div>
                      {file.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(file.due_date).toLocaleDateString()}
                        </div>
                      )}
                      {file.submitted_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Submitted: {new Date(file.submitted_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(file)}
                    <div className="flex gap-2">
                      {file.status === "pending" && (
                        <Button size="sm" onClick={() => handleStatusUpdate(file.id, "submitted")}>
                          Mark Submitted
                        </Button>
                      )}
                      {file.status === "submitted" && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(file.id, "pending")}>
                          Mark Pending
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleFileDownload(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
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
