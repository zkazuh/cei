"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getTeacherFiles, getFileStats, updateFileStatus } from "@/lib/teacher-files"
import type { ActivityFile, Employee } from "@/lib/supabase"
import { FileText, Search, Filter, Calendar, User, AlertTriangle, CheckCircle, Clock, Download } from "lucide-react"

interface TeacherFileWithEmployee extends ActivityFile {
  employees: Employee
}

export default function TeacherFilesPage() {
  const [files, setFiles] = useState<TeacherFileWithEmployee[]>([])
  const [filteredFiles, setFilteredFiles] = useState<TeacherFileWithEmployee[]>([])
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
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterFiles()
  }, [files, filters])

  const loadData = async () => {
    try {
      const [filesData, statsData] = await Promise.all([getTeacherFiles(), getFileStats()])
      setFiles(filesData)
      setStats(statsData)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading teacher files...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Files</h1>
        <p className="text-gray-600">Manage teacher file requirements and submissions</p>
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
                      <Button size="sm" variant="outline">
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
