"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  Calendar,
  Upload,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  getMonthlyRequirements,
  submitTeacherFile,
  updateOverdueRequirements,
  getTeacherFileStats,
  createMonthlyRequirementsForAllTeachers,
} from "@/lib/teacher-files"
import { uploadActivityFile } from "@/lib/activity-files"
import { getEmployeeByUserId } from "@/lib/employees"
import type { MonthlyFileRequirement, Employee } from "@/lib/supabase"

interface RequirementWithEmployee extends MonthlyFileRequirement {
  employees: Employee & {
    users: { name: string; email: string }
  }
}

export default function TeacherFilesPage() {
  const { user } = useAuth()
  const [requirements, setRequirements] = useState<RequirementWithEmployee[]>([])
  const [filteredRequirements, setFilteredRequirements] = useState<RequirementWithEmployee[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "submitted" | "overdue">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementWithEmployee | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    totalRequirements: 0,
    pendingRequirements: 0,
    submittedRequirements: 0,
    overdueRequirements: 0,
    currentMonthPending: 0,
    currentMonthOverdue: 0,
  })

  const monthNames = [
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

  useEffect(() => {
    fetchData()
    if (user) {
      fetchCurrentEmployee()
    }
  }, [user, selectedYear, selectedMonth])

  useEffect(() => {
    filterRequirements()
  }, [requirements, statusFilter])

  const fetchCurrentEmployee = async () => {
    if (user) {
      const employee = await getEmployeeByUserId(user.id)
      setCurrentEmployee(employee)
    }
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Update overdue requirements first
      await updateOverdueRequirements()

      const [requirementsData, statsData] = await Promise.all([
        getMonthlyRequirements(selectedYear, selectedMonth),
        getTeacherFileStats(),
      ])

      setRequirements(requirementsData as RequirementWithEmployee[])
      setStats(statsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher file requirements. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterRequirements = () => {
    let filtered = requirements

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter)
    }

    // If user is a teacher, only show their requirements
    if (user?.role === "employee" && currentEmployee?.category === "teacher") {
      filtered = filtered.filter((req) => req.employee_id === currentEmployee.id)
    }

    setFilteredRequirements(filtered)
  }

  const handleFileUpload = async (files: FileList, requirement: RequirementWithEmployee) => {
    if (!files.length || !currentEmployee) return

    const file = files[0]
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOCX, JPG, or PNG files.",
        variant: "destructive",
      })
      return
    }

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Upload the file to activity files
      const filePath = `teacher-files/${currentEmployee.id}/${Date.now()}-${file.name}`
      const uploadSuccess = await uploadActivityFile(currentEmployee.id, file.name, filePath, file.size, file.type)

      if (uploadSuccess) {
        // Get the uploaded file ID (in a real implementation, uploadActivityFile would return the ID)
        // For now, we'll simulate this by creating a temporary ID
        const tempFileId = `temp-${Date.now()}`

        // Submit the file for this requirement
        const submitSuccess = await submitTeacherFile(requirement.id, tempFileId, user!.id)

        if (submitSuccess) {
          toast({
            title: "File Submitted Successfully",
            description: `Monthly file for ${monthNames[requirement.month - 1]} ${requirement.year} has been submitted.`,
          })

          setIsDialogOpen(false)
          setSelectedRequirement(null)
          await fetchData()
        } else {
          toast({
            title: "Submission Failed",
            description: "Failed to submit the file. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Upload Failed",
          description: "Failed to upload the file. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Error uploading file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const createNewMonthRequirements = async () => {
    if (user?.role !== "admin") return

    try {
      const success = await createMonthlyRequirementsForAllTeachers(selectedYear, selectedMonth)

      if (success) {
        toast({
          title: "Requirements Created",
          description: `Monthly file requirements created for ${monthNames[selectedMonth - 1]} ${selectedYear}.`,
        })

        await fetchData()
      } else {
        toast({
          title: "Creation Failed",
          description: "Failed to create monthly requirements. They may already exist.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Creation Error",
        description: "Error creating monthly requirements. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: "pending" | "submitted" | "overdue") => {
    switch (status) {
      case "submitted":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Teacher", "Employee Number", "Month", "Year", "Due Date", "Status", "Submitted Date"].join(","),
      ...filteredRequirements.map((req) =>
        [
          `"${req.employees.users.name}"`,
          req.employees.employee_number,
          monthNames[req.month - 1],
          req.year,
          new Date(req.due_date).toLocaleDateString(),
          req.status,
          req.activity_files ? new Date(req.activity_files.created_at).toLocaleDateString() : "Not submitted",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `teacher-files-${monthNames[selectedMonth - 1]}-${selectedYear}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "Teacher file requirements exported to CSV.",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const isTeacher = currentEmployee?.category === "teacher"
  const isAdmin = user?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Monthly Files</h1>
          <p className="mt-2 text-gray-600">
            {isTeacher
              ? "Submit your monthly activity files by the 10th of each month"
              : "Track and manage teacher monthly file submissions"}
          </p>
        </div>

        <div className="flex space-x-2">
          {isAdmin && (
            <Button onClick={createNewMonthRequirements} variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Create Requirements
            </Button>
          )}
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequirements}</p>
                <p className="text-sm text-gray-600">Total Requirements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequirements}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.submittedRequirements}</p>
                <p className="text-sm text-gray-600">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.overdueRequirements}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.currentMonthPending}</p>
                <p className="text-sm text-gray-600">This Month Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.currentMonthOverdue}</p>
                <p className="text-sm text-gray-600">This Month Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Year:</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Month:</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-32">
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

      {/* Requirements List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Monthly File Requirements - {monthNames[selectedMonth - 1]} {selectedYear}
          </CardTitle>
          <CardDescription>{filteredRequirements.length} requirements • Due date: 10th of each month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequirements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">No requirements found for this period</p>
                {isAdmin && (
                  <Button onClick={createNewMonthRequirements} className="mt-4">
                    Create Requirements for {monthNames[selectedMonth - 1]} {selectedYear}
                  </Button>
                )}
              </div>
            ) : (
              filteredRequirements.map((requirement) => (
                <div key={requirement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">{requirement.employees.users.name}</h3>
                        <p className="text-sm text-gray-500">{requirement.employees.users.email}</p>
                      </div>
                      {getStatusBadge(requirement.status)}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {requirement.employees.employee_number} • Due:{" "}
                      {new Date(requirement.due_date).toLocaleDateString()}
                      {requirement.activity_files && (
                        <span>
                          {" "}
                          • Submitted: {new Date(requirement.activity_files.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {requirement.status !== "submitted" &&
                      ((isTeacher && requirement.employee_id === currentEmployee?.id) || isAdmin) && (
                        <Dialog
                          open={isDialogOpen && selectedRequirement?.id === requirement.id}
                          onOpenChange={(open) => {
                            setIsDialogOpen(open)
                            if (!open) setSelectedRequirement(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedRequirement(requirement)}
                              className={requirement.status === "overdue" ? "bg-red-600 hover:bg-red-700" : ""}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {requirement.status === "overdue" ? "Upload (Overdue)" : "Upload File"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upload Monthly File</DialogTitle>
                              <DialogDescription>
                                Upload the monthly activity file for {requirement.employees.users.name} -{" "}
                                {monthNames[requirement.month - 1]} {requirement.year}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4">
                                  <label htmlFor="file-upload" className="cursor-pointer">
                                    <span className="text-lg font-medium text-primary hover:text-primary/80">
                                      Click to upload
                                    </span>
                                    <input
                                      id="file-upload"
                                      type="file"
                                      className="sr-only"
                                      accept=".pdf,.docx,.jpg,.jpeg,.png"
                                      onChange={(e) => e.target.files && handleFileUpload(e.target.files, requirement)}
                                      disabled={isUploading}
                                    />
                                  </label>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">PDF, DOCX, JPG, PNG up to 10MB</p>
                              </div>

                              {isUploading && (
                                <div className="flex items-center justify-center space-x-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-sm">Uploading file...</span>
                                </div>
                              )}
                            </div>

                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUploading}>
                                Cancel
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                    {requirement.status === "submitted" && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
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
