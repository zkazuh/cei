"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Download, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { getMonthlyRequirements, getOverdueRequirements } from "@/lib/teacher-files"
import type { MonthlyFileRequirement } from "@/lib/supabase"

export default function TeacherFilesPage() {
  const [requirements, setRequirements] = useState<MonthlyFileRequirement[]>([])
  const [overdueRequirements, setOverdueRequirements] = useState<MonthlyFileRequirement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [allRequirements, overdue] = await Promise.all([getMonthlyRequirements(), getOverdueRequirements()])
        setRequirements(allRequirements)
        setOverdueRequirements(overdue)
      } catch (error) {
        console.error("Error loading teacher files:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-100 text-green-800">Submitted</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Files</h1>
        <p className="text-gray-600">Manage monthly activity file requirements</p>
      </div>

      {/* Overdue Requirements Alert */}
      {overdueRequirements.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Overdue Requirements ({overdueRequirements.length})
            </CardTitle>
            <CardDescription className="text-red-700">
              The following requirements are past their due date and need immediate attention.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueRequirements.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium">{(req as any).employee?.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(0, req.month - 1).toLocaleString("default", { month: "long" })} {req.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600">Due: {new Date(req.due_date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">
                      {Math.ceil((new Date().getTime() - new Date(req.due_date).getTime()) / (1000 * 60 * 60 * 24))}{" "}
                      days overdue
                    </p>
                  </div>
                </div>
              ))}
              {overdueRequirements.length > 5 && (
                <p className="text-sm text-red-600 text-center">
                  And {overdueRequirements.length - 5} more overdue requirements...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
          <CardDescription>Upload monthly activity files for teachers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
              <p className="mt-2 text-sm text-gray-600">Drag and drop files here, or click to select files</p>
              <p className="text-xs text-gray-500">Supported formats: PDF, DOC, DOCX (Max 10MB)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Monthly Requirements ({requirements.length})
          </CardTitle>
          <CardDescription>Track monthly activity file submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {requirements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No file requirements found.</div>
          ) : (
            <div className="space-y-4">
              {requirements.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(req.status)}
                    <div>
                      <h3 className="font-medium">{(req as any).employee?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {(req as any).employee?.employee_number} • {(req as any).employee?.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {new Date(0, req.month - 1).toLocaleString("default", { month: "long" })} {req.year}
                      </p>
                      <p className="text-sm text-gray-600">Due: {new Date(req.due_date).toLocaleDateString()}</p>
                      {req.submitted_at && (
                        <p className="text-xs text-green-600">
                          Submitted: {new Date(req.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(req.status)}
                      {req.status === "submitted" && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
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
