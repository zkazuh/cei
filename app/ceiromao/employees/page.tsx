"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Filter } from "lucide-react"
import { getEmployees, getDepartments } from "@/lib/employee-management"
import type { Employee } from "@/lib/supabase"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    department: "all",
    status: "all",
    category: "all",
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [employeesData, departmentsData] = await Promise.all([getEmployees(filters), getDepartments()])
        setEmployees(employeesData)
        setDepartments(departmentsData)
      } catch (error) {
        console.error("Error loading employees:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading employees...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <p className="text-gray-600">Manage employee information and records</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.department} onValueChange={(value) => handleFilterChange("department", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="outsourced">Outsourced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee List ({employees.length})
          </CardTitle>
          <CardDescription>
            {filters.search || filters.department !== "all" || filters.status !== "all" || filters.category !== "all"
              ? "Filtered results"
              : "All employees"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No employees found matching the current filters.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{employee.name}</h3>
                          <p className="text-sm text-gray-600">{employee.employee_number}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                            {employee.status}
                          </Badge>
                          <Badge variant="outline">{employee.category}</Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Position:</span> {employee.position}
                        </p>
                        <p>
                          <span className="font-medium">Department:</span> {employee.department}
                        </p>
                        <p>
                          <span className="font-medium">Hire Date:</span>{" "}
                          {new Date(employee.hire_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
