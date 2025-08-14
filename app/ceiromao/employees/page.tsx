"use client"

import type React from "react"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from "@/lib/employee-management"
import type { Employee } from "@/lib/supabase"
import { Users, Plus, Edit, Trash2, Search, UserCheck, UserX, GraduationCap, Briefcase, UserCog } from "lucide-react"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byCategory: {} as Record<string, number>,
    byDepartment: {} as Record<string, number>,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    department: "all",
    status: "all",
    category: "all",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    employee_number: "",
    name: "",
    position: "",
    department: "",
    category: "regular" as "regular" | "outsourced" | "teacher",
    status: "active" as "active" | "inactive",
    hire_date: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [employeesData, statsData] = await Promise.all([getEmployees(filters), getEmployeeStats()])
      setEmployees(employeesData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading employees data:", error)
      toast({
        title: "Error",
        description: "Failed to load employees data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingEmployee) {
        const updated = await updateEmployee(editingEmployee.id, formData)
        if (updated) {
          toast({
            title: "Success",
            description: "Employee updated successfully",
          })
        } else {
          throw new Error("Failed to update employee")
        }
      } else {
        const created = await createEmployee(formData)
        if (created) {
          toast({
            title: "Success",
            description: "Employee created successfully",
          })
        } else {
          throw new Error("Failed to create employee")
        }
      }
      setIsDialogOpen(false)
      setEditingEmployee(null)
      resetForm()
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: editingEmployee ? "Failed to update employee" : "Failed to create employee",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      employee_number: employee.employee_number,
      name: employee.name,
      position: employee.position,
      department: employee.department,
      category: employee.category,
      status: employee.status,
      hire_date: employee.hire_date,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteEmployee(id)
      if (success) {
        toast({
          title: "Success",
          description: "Employee deleted successfully",
        })
        loadData()
      } else {
        throw new Error("Failed to delete employee")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      employee_number: "",
      name: "",
      position: "",
      department: "",
      category: "regular",
      status: "active",
      hire_date: "",
    })
  }

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "teacher":
        return <GraduationCap className="h-4 w-4" />
      case "outsourced":
        return <UserCog className="h-4 w-4" />
      default:
        return <Briefcase className="h-4 w-4" />
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "teacher":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            Teacher
          </Badge>
        )
      case "outsourced":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <UserCog className="h-3 w-3" />
            Outsourced
          </Badge>
        )
      default:
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            Regular
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
            <Users className="h-8 w-8" />
            Employee Management
          </h1>
          <p className="text-muted-foreground">Manage employee information and categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
                setEditingEmployee(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
              <DialogDescription>
                {editingEmployee ? "Update employee information" : "Enter the details for the new employee"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employee_number" className="text-right">
                    Employee #
                  </Label>
                  <Input
                    id="employee_number"
                    value={formData.employee_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employee_number: e.target.value }))}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="position" className="text-right">
                    Position
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: "regular" | "outsourced" | "teacher") =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="outsourced">Outsourced</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hire_date" className="text-right">
                    Hire Date
                  </Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hire_date: e.target.value }))}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingEmployee ? "Update Employee" : "Create Employee"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Not currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.byCategory.teacher || 0}</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={filters.department}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Object.keys(stats.byDepartment).map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="outsourced">Outsourced</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>Manage your organization's employees</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No employees found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      {getCategoryIcon(employee.category)}
                    </div>
                    <div>
                      <h3 className="font-medium">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {employee.position} • {employee.department}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{employee.employee_number} • Hired: {new Date(employee.hire_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {getCategoryBadge(employee.category)}

                    <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                      {employee.status === "active" ? (
                        <UserCheck className="h-3 w-3 mr-1" />
                      ) : (
                        <UserX className="h-3 w-3 mr-1" />
                      )}
                      {employee.status}
                    </Badge>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the employee record for{" "}
                              {employee.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(employee.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
