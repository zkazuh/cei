"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  getTeacherFiles,
  createFileRequirement,
  uploadFile,
  downloadFile,
  updateFileStatus,
  type TeacherFile,
} from "@/lib/teacher-files"
import {
  FileText,
  Upload,
  Download,
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"

export default function TeacherFilesPage() {
  const [files, setFiles] = useState<TeacherFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [requirementFilter, setRequirementFilter] = useState<string>("all")
  const [createRequirementOpen, setCreateRequirementOpen] = useState(false)
  const [uploadFileOpen, setUploadFileOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<TeacherFile | null>(null)
  const { toast } = useToast()

  // Form states
  const [newRequirement, setNewRequirement] = useState({
    title: "",
    description: "",
    requirementType: "",
    dueDate: "",
    assignedTo: "",
  })

  const [uploadForm, setUploadForm] = useState({
    requirementId: "",
    file: null as File | null,
    notes: "",
  })

  useEffect(() => {
    loadFiles()
  }, [])

  async function loadFiles() {
    try {
      setLoading(true)
      const data = await getTeacherFiles()
      setFiles(data)
    } catch (error) {
      console.error("Error loading files:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateRequirement() {
    try {
      const success = await createFileRequirement(
        newRequirement.title,
        newRequirement.description,
        newRequirement.requirementType,
        newRequirement.dueDate,
        newRequirement.assignedTo || undefined,
      )

      if (success) {
        toast({
          title: "Success",
          description: "File requirement created successfully",
        })
        setCreateRequirementOpen(false)
        setNewRequirement({
          title: "",
          description: "",
          requirementType: "",
          dueDate: "",
          assignedTo: "",
        })
        loadFiles()
      } else {
        throw new Error("Failed to create requirement")
      }
    } catch (error) {
      console.error("Error creating requirement:", error)
      toast({
        title: "Error",
        description: "Failed to create file requirement",
        variant: "destructive",
      })
    }
  }

  async function handleUploadFile() {
    try {
      if (!uploadForm.file || !uploadForm.requirementId) {
        toast({
          title: "Error",
          description: "Please select a file and requirement",
          variant: "destructive",
        })
        return
      }

      const success = await uploadFile(uploadForm.requirementId, uploadForm.file, uploadForm.notes)

      if (success) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        setUploadFileOpen(false)
        setUploadForm({
          requirementId: "",
          file: null,
          notes: "",
        })
        loadFiles()
      } else {
        throw new Error("Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    }
  }

  async function handleDownloadFile(file: TeacherFile) {
    try {
      const success = await downloadFile(file.id)
      if (success) {
        toast({
          title: "Success",
          description: "File download started",
        })
      } else {
        throw new Error("Failed to download file")
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

  async function handleUpdateStatus(fileId: string, status: "pending" | "submitted" | "approved" | "rejected") {
    try {
      const success = await updateFileStatus(fileId, status)
      if (success) {
        toast({
          title: "Success",
          description: "File status updated successfully",
        })
        loadFiles()
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update file status",
        variant: "destructive",
      })
    }
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.requirement_type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || file.status === statusFilter
    const matchesRequirement = requirementFilter === "all" || file.requirement_type === requirementFilter

    return matchesSearch && matchesStatus && matchesRequirement
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      submitted: "default",
      pending: "secondary",
      overdue: "destructive",
      approved: "default",
      rejected: "destructive",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
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
          <Dialog open={createRequirementOpen} onOpenChange={setCreateRequirementOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Requirement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create File Requirement</DialogTitle>
                <DialogDescription>Create a new file requirement for teachers</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newRequirement.title}
                    onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                    placeholder="Enter requirement title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRequirement.description}
                    onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                    placeholder="Enter requirement description"
                  />
                </div>
                <div>
                  <Label htmlFor="requirementType">Requirement Type</Label>
                  <Select
                    value={newRequirement.requirementType}
                    onValueChange={(value) => setNewRequirement({ ...newRequirement, requirementType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select requirement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newRequirement.dueDate}
                    onChange={(e) => setNewRequirement({ ...newRequirement, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
                  <Input
                    id="assignedTo"
                    value={newRequirement.assignedTo}
                    onChange={(e) => setNewRequirement({ ...newRequirement, assignedTo: e.target.value })}
                    placeholder="Enter teacher ID or leave blank for all"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateRequirementOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRequirement}>Create Requirement</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={uploadFileOpen} onOpenChange={setUploadFileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
                <DialogDescription>Upload a file for a specific requirement</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="requirement">Requirement</Label>
                  <Select
                    value={uploadForm.requirementId}
                    onValueChange={(value) => setUploadForm({ ...uploadForm, requirementId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      {files
                        .filter((f) => f.status === "pending")
                        .map((file) => (
                          <SelectItem key={file.id} value={file.id}>
                            {file.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                    placeholder="Add any notes about this submission"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setUploadFileOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUploadFile}>Upload File</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={requirementFilter} onValueChange={setRequirementFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
            <SelectItem value="assessment">Assessment</SelectItem>
            <SelectItem value="report">Report</SelectItem>
            <SelectItem value="certificate">Certificate</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFiles.map((file) => (
          <Card key={file.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(file.status)}
                  <CardTitle className="text-lg">{file.title}</CardTitle>
                </div>
                {getStatusBadge(file.status)}
              </div>
              <CardDescription>{file.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span className="capitalize">{file.requirement_type.replace("_", " ")}</span>
                </div>

                {file.due_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {new Date(file.due_date).toLocaleDateString()}</span>
                  </div>
                )}

                {file.assigned_to && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Assigned to: {file.assigned_to}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {file.file_path && (
                    <Button size="sm" variant="outline" onClick={() => handleDownloadFile(file)}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}

                  {file.status === "pending" && (
                    <Button size="sm" onClick={() => handleUpdateStatus(file.id, "submitted")}>
                      Mark Submitted
                    </Button>
                  )}

                  {file.status === "submitted" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(file.id, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(file.id, "rejected")}>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || requirementFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first file requirement to get started"}
          </p>
        </div>
      )}
    </div>
  )
}
