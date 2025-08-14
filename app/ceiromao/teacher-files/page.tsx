"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  getTeacherFileRequirements,
  getTeacherFileStats,
  uploadTeacherFile,
  downloadTeacherFile,
} from "@/lib/teacher-files"
import type { MonthlyFileRequirement, Employee } from "@/lib/supabase"
import { FileText, Upload, Download, Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react"

export default function TeacherFilesPage() {
  const [requirements, setRequirements] = useState<(MonthlyFileRequirement & { employee: Employee })[]>([])
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    pending: 0,
    overdue: 0,
    byMonth: {} as Record<string, number>,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadRequirements()
    loadStats()
  }, [])

  const loadRequirements = async () => {
    setIsLoading(true)
    try {
      const data = await getTeacherFileRequirements()
      setRequirements(data)
    } catch (error) {
      console.error("Error loading requirements:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher file requirements",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await getTeacherFileStats()
      setStats(statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleFileUpload = async (
    requirementId: string,
    employeeId: string,
    year: number,
    month: number,
    file: File,
  ) => {
    setUploadingId(requirementId)
    try {
      const success = await uploadTeacherFile(employeeId, file, year, month)
      if (success) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        loadRequirements()
        loadStats()
      } else {
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploadingId(null)
    }
  }

  const handleFileDownload = async (fileId: string, filename: string) => {
    try {
      const filePath = await downloadTeacherFile(fileId)
      if (filePath) {
        // In production, this would trigger an actual download
        toast({
          title: "Download",
          description: `Downloading ${filename}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to download file",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
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
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
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
    return months[month - 1]
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Teacher Files
        </h1>
        <p className="text-muted-foreground">Manage monthly activity file requirements for teachers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Requirements List */}
      <Card>
        <CardHeader>
          <CardTitle>File Requirements</CardTitle>
          <CardDescription>
            {requirements.length} requirement{requirements.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No file requirements found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requirements.map((requirement) => (
                <div key={requirement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{requirement.employee.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getMonthName(requirement.month)} {requirement.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(requirement.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(requirement.status)}

                    {requirement.status === "pending" && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleFileUpload(
                                requirement.id,
                                requirement.employee_id,
                                requirement.year,
                                requirement.month,
                                file,
                              )
                            }
                          }}
                          className="hidden"
                          id={`file-${requirement.id}`}
                        />
                        <Label htmlFor={`file-${requirement.id}`}>
                          <Button variant="outline" size="sm" disabled={uploadingId === requirement.id} asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingId === requirement.id ? "Uploading..." : "Upload"}
                            </span>
                          </Button>
                        </Label>
                      </div>
                    )}

                    {requirement.status === "submitted" && requirement.activity_file_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileDownload(requirement.activity_file_id!, "activity-file.pdf")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
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
