"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, Trash2, CheckCircle, Clock, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  getActivityFiles,
  uploadActivityFile,
  updateFileStatus,
  deleteActivityFile,
  getActivityFileStats,
} from "@/lib/activity-files"
import { getEmployeeByUserId } from "@/lib/employees"
import type { ActivityFile, Employee } from "@/lib/supabase"

interface ActivityFileWithEmployee extends ActivityFile {
  employees: Employee & {
    users: { name: string; email: string }
  }
}

export default function ActivityHoursPage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<ActivityFileWithEmployee[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFiles: 0,
    pendingFiles: 0,
    approvedFiles: 0,
    rejectedFiles: 0,
  })

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [filesResult, statsResult] = await Promise.all([getActivityFiles(), getActivityFileStats()])

      setFiles(filesResult as ActivityFileWithEmployee[])
      setStats(statsResult)

      // Get current user's employee record
      if (user) {
        const employee = await getEmployeeByUserId(user.id)
        setCurrentEmployee(employee)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load activity files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileUpload(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFileUpload(selectedFiles)
  }

  const handleFileUpload = async (uploadedFiles: File[]) => {
    if (uploadedFiles.length === 0 || !currentEmployee) return

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ]
    const maxSize = 10 * 1024 * 1024 // 10MB

    for (const file of uploadedFiles) {
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported file type. Please upload PDF, DOCX, JPG, or PNG files.`,
          variant: "destructive",
        })
        continue
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is too large. Maximum file size is 10MB.`,
          variant: "destructive",
        })
        continue
      }

      // Simulate file upload with progress
      setIsUploading(true)
      setUploadProgress(0)

      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(uploadInterval)
            setIsUploading(false)
            return 0
          }
          return prev + 10
        })
      }, 100)

      try {
        // In a real implementation, you would upload to Supabase Storage first
        const filePath = `activity-files/${currentEmployee.id}/${Date.now()}-${file.name}`

        const success = await uploadActivityFile(currentEmployee.id, file.name, filePath, file.size, file.type)

        if (success) {
          toast({
            title: "File Uploaded Successfully",
            description: `${file.name} has been uploaded and is pending review.`,
          })

          // Refresh the files list
          await fetchData()
        } else {
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}. Please try again.`,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Upload Error",
          description: `Error uploading ${file.name}. Please try again.`,
          variant: "destructive",
        })
      }
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      const success = await deleteActivityFile(fileId, user!.id)

      if (success) {
        setFiles((prev) => prev.filter((file) => file.id !== fileId))
        toast({
          title: "File Deleted",
          description: "The file has been removed successfully.",
        })

        // Update stats
        await fetchData()
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete the file. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Delete Error",
        description: "Error deleting the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (fileId: string, newStatus: "approved" | "rejected") => {
    if (user?.role !== "admin") return

    try {
      const success = await updateFileStatus(fileId, newStatus, user.id)

      if (success) {
        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileId
              ? { ...file, status: newStatus, reviewed_by: user.id, reviewed_at: new Date().toISOString() }
              : file,
          ),
        )

        toast({
          title: "Status Updated",
          description: `File status has been updated to ${newStatus}.`,
        })

        // Update stats
        await fetchData()
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update file status. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Update Error",
        description: "Error updating file status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <Trash2 className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Hours</h1>
        <p className="mt-2 text-gray-600">Submit and manage your activity hour documentation</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                <p className="text-sm text-gray-600">Total Files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pendingFiles}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.approvedFiles}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trash2 className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedFiles}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Activity Hour Files</CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse. Supported formats: PDF, DOCX, JPG, PNG (Max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-primary hover:text-primary/80">Click to upload</span>
                <span className="text-gray-500"> or drag and drop</span>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">PDF, DOCX, JPG, PNG up to 10MB</p>
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Files</CardTitle>
          <CardDescription>View and manage your submitted activity hour files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">No files uploaded yet</p>
              </div>
            ) : (
              files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">{file.file_name}</h3>
                      <p className="text-sm text-gray-500">
                        {(file.file_size / (1024 * 1024)).toFixed(1)} MB • Uploaded by {file.employees?.users?.name} •{" "}
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(file.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(file.status)}
                        <span className="capitalize">{file.status}</span>
                      </div>
                    </Badge>

                    {user?.role === "admin" && file.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(file.id, "approved")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(file.id, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    )}

                    <Button size="sm" variant="ghost" onClick={() => handleFileDelete(file.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
