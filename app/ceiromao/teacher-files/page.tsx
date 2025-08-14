"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  getTeachers,
  getMonthlyRequirements,
  uploadActivityFile,
  downloadActivityFile,
  getTeacherFileStats,
  createMonthlyRequirements,
  updateOverdueRequirements,
} from "@/lib/teacher-files"
import type { Employee, MonthlyFileRequirement } from "@/lib/supabase"
import { Upload, Download, FileText, Calendar, AlertCircle, CheckCircle } from "lucide-react"

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
    totalRequirements: 0,
    submitted: 0,
    pending: 0,
    overdue: 0,
    byMonth: {} as Record<string, { submitted: number; pending: number; overdue: number }>,
  })
  const [filters, setFilters] = useState({
    teacherId: "all",
    year: new Date().getFullYear(),
    month: 0, // 0 means all months
    status: "all",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<MonthlyFileRequirement | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTeachers()
    loadRequirements()
    loadStats()
  }, [filters])

  const loadTeachers = async () => {
    const data = await getTeachers()
    setTeachers(data)
  }

  const loadRequirements = async () => {
    setIsLoading(true)
    const data = await getMonthlyRequirements({
      teacherId: filters.teacherId !== "all" ? filters.teacherId : undefined,
      year: filters.year,
      month: filters.month > 0 ? filters.month : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
    })
    setRequirements(data)
    setIsLoading(false)
  }

  const loadStats = async () => {
    const statsData = await getTeacherFileStats()
    setStats(statsData)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRequirement || !uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await uploadActivityFile(
        selectedRequirement.employee_id,
        uploadFile,
        selectedRequirement.year,
        selectedRequirement.month,
      )

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        loadRequirements()
        loadStats()
        setIsUploadDialogOpen(false)
        setSelectedRequirement(null)
        setUploadFile(null)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Upload failed. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (fileId: string) => {
    try {
      const result = await downloadActivityFile(fileId)

      if (result.success && result.url) {
        // In a real app, this would trigger the actual file download
        toast({
          title: "Success",
          description: "File download started",
        })
        // window.open(result.url, '_blank')
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Download failed. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateRequirements = async () => {
    const count = await createMonthlyRequirements(filters.year, new Date().getMonth() + 1)

    if (count > 0) {
      toast({
        title: "Success",
        description: `Created ${count} monthly requirements`,
      })
      loadRequirements()
      loadStats()
    } else {
      toast({
        title: "Info",
        description: "No new requirements created",
      })
    }
  }

  const handleUpdateOverdue = async () => {
    const count = await updateOverdueRequirements()

    if (count > 0) {
      toast({
        title: "Success",
        description: `Updated ${count} overdue requirements`,
      })
      loadRequirements()
      loadStats()
    } else {
      toast({
        title: "Info",
        description: "No overdue requirements found",
      })
    }
  }

  const openUploadDialog = (requirement: MonthlyFileRequirement) => {
    setSelectedRequirement(requirement)
    setIsUploadDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Submitted
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Calendar className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const getTeacherName = (employeeId: string) => {
    const teacher = teachers.find((t) => t.id === employeeId)
    return teacher?.name || "Unknown Teacher"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Files</h1>
          <p className="text-muted-foreground">Manage monthly activity file submissions</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleCreateRequirements} variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Create Requirements
          </Button>
          <Button onClick={handleUpdateOverdue} variant="outline">
            <AlertCircle className="mr-2 h-4 w-4" />
            Update Overdue
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequirements}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter requirements by teacher, year, month, or status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={filters.teacherId} onValueChange={(value) => setFilters({ ...filters, teacherId: value })}>
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
            <div className="space-y-2">
              <Label>Year</Label>
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
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={filters.month.toString()}
                onValueChange={(value) => setFilters({ ...filters, month: Number.parseInt(value) })}
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
              <Label>Status</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* Requirements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Requirements</CardTitle>
          <CardDescription>
            {requirements.length} requirement{requirements.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading requirements...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirements.map((requirement) => (
                  <TableRow key={requirement.id}>
                    <TableCell className="font-medium">
                      {requirement.employee?.name || getTeacherName(requirement.employee_id)}
                    </TableCell>
                    <TableCell>{requirement.year}</TableCell>
                    <TableCell>{MONTHS[requirement.month - 1]}</TableCell>
                    <TableCell>{new Date(requirement.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(requirement.status)}</TableCell>
                    <TableCell>
                      {requirement.submitted_at ? new Date(requirement.submitted_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {requirement.status === "pending" || requirement.status === "overdue" ? (
                          <Button variant="outline" size="sm" onClick={() => openUploadDialog(requirement)}>
                            <Upload className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => requirement.activity_file_id && handleDownload(requirement.activity_file_id)}
                            disabled={!requirement.activity_file_id}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Activity File</DialogTitle>
            <DialogDescription>
              Upload the monthly activity file for{" "}
              {selectedRequirement && (
                <>
                  <strong>{getTeacherName(selectedRequirement.employee_id)}</strong> -{" "}
                  {MONTHS[selectedRequirement.month - 1]} {selectedRequirement.year}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  File
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="text-sm text-muted-foreground">Accepted formats: PDF, DOC, DOCX, XLS, XLSX</div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!uploadFile}>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
