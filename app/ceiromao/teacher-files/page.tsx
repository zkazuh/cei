"use client"

import { useState, useEffect } from "react"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getTeachers,
  getMonthlyFileRequirements,
  uploadActivityFile,
  downloadActivityFile,
  getFileStats,
  createMonthlyRequirements,
  updateOverdueRequirements,
} from "@/lib/teacher-files"
import type { Employee, MonthlyFileRequirement } from "@/lib/supabase"
import {
  GraduationCap,
  Upload,
  Download,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"

const MONTHS = [
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

export default function TeacherFilesPage() {
  const [teachers, setTeachers] = useState<Employee[]>([])
  const [requirements, setRequirements] = useState<MonthlyFileRequirement[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    overdue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: 0, // 0 means all months
    status: "all",
    teacherId: "all",
  })
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<MonthlyFileRequirement | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [teachersData, requirementsData, statsData] = await Promise.all([
        getTeachers(),
        getMonthlyFileRequirements(filters),
        getFileStats(),
      ])
      setTeachers(teachersData)
      setRequirements(requirementsData)
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

  const handleUpload = async () => {
    if (!selectedRequirement || !uploadFile) return

    try {
      const success = await uploadActivityFile(
        selectedRequirement.employee_id,
        uploadFile,
        selectedRequirement.year,
        selectedRequirement.month,
      )

      if (success) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        setIsUploadDialogOpen(false)
        setSelectedRequirement(null)
        setUploadFile(null)
        loadData()
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

  const handleDownload = async (requirement: MonthlyFileRequirement) => {
    if (!requirement.activity_file_id) return

    try {
      const blob = await downloadActivityFile(requirement.activity_file_id)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${requirement.employee?.name}_${MONTHS[requirement.month - 1]}_${requirement.year}.pdf`
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

  const handleCreateRequirements = async () => {
    try {
      const count = await createMonthlyRequirements(filters.year, new Date().getMonth() + 1)
      if (count > 0) {
        toast({
          title: "Success",
          description: `Created ${count} monthly requirements`,
        })
        loadData()
      } else {
        toast({
          title: "Info",
          description: "No new requirements created (may already exist)",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create requirements",
        variant: "destructive",
      })
    }
  }

  const handleUpdateOverdue = async () => {
    try {
      const count = await updateOverdueRequirements()
      if (count > 0) {
        toast({
          title: "Success",
          description: `Updated ${count} overdue requirements`,
        })
        loadData()
      } else {
        toast({
          title: "Info",
          description: "No overdue requirements found",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "overdue":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
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
          <Button onClick={handleCreateRequirements} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Create Requirements
          </Button>
          <Button onClick={handleUpdateOverdue} variant="outline">
            <AlertCircle className="h-4 w-4 mr-2" />
            Update Overdue
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
            <p className="text-xs text-muted-foreground">All file requirements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">Files submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting submission</p>
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
          <CardTitle>Filter Requirements</CardTitle>
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
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
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
                  <SelectItem value="0">All Months</SelectItem>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
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

            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher</Label>
              <Select
                value={filters.teacherId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, teacherId: value }))}
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
                      <h3 className="font-medium">{requirement.employee?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {MONTHS[requirement.month - 1]} {requirement.year}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(requirement.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {getStatusBadge(requirement.status)}

                    <div className="flex space-x-2">
                      {requirement.status === "submitted" && requirement.activity_file_id ? (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(requirement)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      ) : (
                        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedRequirement(requirement)}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upload Activity File</DialogTitle>
                              <DialogDescription>
                                Upload the monthly activity file for {selectedRequirement?.employee?.name} -{" "}
                                {selectedRequirement && MONTHS[selectedRequirement.month - 1]}{" "}
                                {selectedRequirement?.year}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="file">Select File</Label>
                                <Input
                                  id="file"
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                />
                                <p className="text-xs text-muted-foreground">Accepted formats: PDF, DOC, DOCX</p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleUpload} disabled={!uploadFile}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload File
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
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
