"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Users, Plus, Edit, Trash2, Search, UserX, Building, ExternalLink, Loader2, GraduationCap } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from "@/lib/employee-management"
import type { Employee } from "@/lib/supabase"
import type { CreateEmployeeData, UpdateEmployeeData } from "@/lib/employee-management"

interface EmployeeWithUser extends Employee {
  users: { name: string; email: string }
}

export default function EmployeesPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeWithUser[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | "regular" | "outsourced" | "teacher">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    regularEmployees: 0,
    outsourcedEmployees: 0,
    teacherEmployees: 0,
    inactiveEmployees: 0,
  })

  // Form states
  const [formData, setFormData] = useState<CreateEmployeeData>({
    name: "",
    email: "",
    employee_number: "",
    department: "",
    position: "",
    hire_date: "",
    category: "regular",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchTerm, categoryFilter, statusFilter])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [employeesData, statsData] = await Promise.all([
        getAllEmployees(true), // Include inactive employees
        getEmployeeStats(),
      ])

      setEmployees(employeesData as EmployeeWithUser[])
      setStats(statsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterEmployees = () => {
    let filtered = employees

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.position?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((emp) => emp.category === categoryFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((emp) =>
        statusFilter === "active" ? emp.status === "active" : emp.status !== "active",
      )
    }

    setFilteredEmployees(filtered)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      employee_number: "",
      department: "",
      position: "",
      hire_date: "",
      category: "regular",
    })
  }

  const handleCreateEmployee = async () => {
    if (!user || user.role !== "admin") return

    setIsSubmitting(true)
    try {
      const success = await createEmployee(formData, user.id)

      if (success) {
        toast({
          title: "Employee Created",
          description: `${formData.name} has been added successfully.`,
        })

        setIsCreateDialogOpen(false)
        resetForm()
        await fetchData()
      } else {
        toast({
          title: "Error",
          description: "Failed to create employee. Please check if the email or employee number already exists.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditEmployee = async () => {
    if (!user || user.role !== "admin" || !selectedEmployee) return

    setIsSubmitting(true)
    try {
      const updateData: UpdateEmployeeData = {
        name: formData.name,
        email: formData.email,
        employee_number: formData.employee_number,
        department: formData.department,
        position: formData.position,
        hire_date: formData.hire_date,
        category: formData.category,
      }

      const success = await updateEmployee(selectedEmployee.id, updateData, user.id)

      if (success) {
        toast({
          title: "Employee Updated",
          description: `${formData.name} has been updated successfully.`,
        })

        setIsEditDialogOpen(false)
        setSelectedEmployee(null)
        resetForm()
        await fetchData()
      } else {
        toast({
          title: "Error",
          description: "Failed to update employee. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEmployee = async (employee: EmployeeWithUser) => {
    if (!user || user.role !== "admin") return

    try {
      const success = await deleteEmployee(employee.id, user.id)

      if (success) {
        toast({
          title: "Employee Deactivated",
          description: `${employee.users.name} has been deactivated.`,
        })

        await fetchData()
      } else {
        toast({
          title: "Error",
          description: "Failed to deactivate employee. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (employee: EmployeeWithUser) => {
    setSelectedEmployee(employee)
    setFormData({
      name: employee.users.name,
      email: employee.users.email,
      employee_number: employee.employee_number,
      department: employee.department || "",
      position: employee.position || "",
      hire_date: employee.hire_date || "",
      category: employee.category,
    })
    setIsEditDialogOpen(true)
  }

  const getCategoryBadge = (category: "regular" | "outsourced" | "teacher") => {
    if (category === "outsourced") {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <ExternalLink className="h-3 w-3 mr-1" />
          Outsourced
        </Badge>
      )
    } else if (category === "teacher") {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <GraduationCap className="h-3 w-3 mr-1" />
          Teacher
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Building className="h-3 w-3 mr-1" />
          Regular
        </Badge>
      )
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="mt-2 text-gray-600">Manage employee records, categories, and information</p>
        </div>

        {user?.role === "admin" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Employee</DialogTitle>
                <DialogDescription>
                  Add a new employee to the system. They will receive default login credentials.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employee_number">Employee Number</Label>
                    <Input
                      id="employee_number"
                      value={formData.employee_number}
                      onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Development"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Software Developer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hire_date">Hire Date</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: "regular" | "outsourced" | "teacher") =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular Employee</SelectItem>
                        <SelectItem value="outsourced">Outsourced</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEmployee}
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.employee_number}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Employee"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.regularEmployees}</p>
                <p className="text-sm text-gray-600">Regular</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ExternalLink className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.outsourcedEmployees}</p>
                <p className="text-sm text-gray-600">Outsourced</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.teacherEmployees}</p>
                <p className="text-sm text-gray-600">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.inactiveEmployees}</p>
                <p className="text-sm text-gray-600">Inactive</p>
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
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="outsourced">Outsourced</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
          <CardDescription>
            {categoryFilter === "outsourced" && (
              <span className="text-orange-600 font-medium">
                Note: Outsourced employees are excluded from attendance reports
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">No employees found</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{employee.users.name}</h3>
                        <p className="text-sm text-gray-500">{employee.users.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        {getCategoryBadge(employee.category)}
                        <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                          {employee.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {employee.employee_number} • {employee.department} • {employee.position}
                      {employee.hire_date && ` • Hired: ${new Date(employee.hire_date).toLocaleDateString()}`}
                    </div>
                  </div>

                  {user?.role === "admin" && (
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>

                      {employee.status === "active" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate Employee</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to deactivate {employee.users.name}? This will mark them as
                                inactive but preserve their data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEmployee(employee)}>
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information and settings.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_name">Full Name</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_employee_number">Employee Number</Label>
                <Input
                  id="edit_employee_number"
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_department">Department</Label>
                <Input
                  id="edit_department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_position">Position</Label>
                <Input
                  id="edit_position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_hire_date">Hire Date</Label>
                <Input
                  id="edit_hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: "regular" | "outsourced" | "teacher") =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Employee</SelectItem>
                    <SelectItem value="outsourced">Outsourced</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditEmployee}
              disabled={isSubmitting || !formData.name || !formData.email || !formData.employee_number}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Employee"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
