import { supabase } from "./supabase"
import type { Employee } from "./supabase"

export interface CreateEmployeeData {
  name: string
  email: string
  employee_number: string
  department: string
  position: string
  hire_date: string
  category: "regular" | "outsourced" | "teacher"
}

export interface UpdateEmployeeData {
  name?: string
  email?: string
  employee_number?: string
  department?: string
  position?: string
  hire_date?: string
  category?: "regular" | "outsourced" | "teacher"
  is_active?: boolean
}

export async function createEmployee(employeeData: CreateEmployeeData, createdBy: string): Promise<boolean> {
  try {
    // First, create the user account
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email: employeeData.email,
        password_hash: "$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm", // Default password
        name: employeeData.name,
        role: "employee",
      })
      .select()
      .single()

    if (userError) {
      console.error("Error creating user:", userError)
      return false
    }

    // Then create the employee record
    const { error: employeeError } = await supabase.from("employees").insert({
      user_id: user.id,
      employee_number: employeeData.employee_number,
      department: employeeData.department,
      position: employeeData.position,
      hire_date: employeeData.hire_date,
      category: employeeData.category,
      is_active: true,
    })

    if (employeeError) {
      console.error("Error creating employee:", employeeError)
      // Clean up user if employee creation failed
      await supabase.from("users").delete().eq("id", user.id)
      return false
    }

    // If this is a teacher, create monthly file requirements for current and next few months
    if (employeeData.category === "teacher") {
      await createMonthlyRequirementsForTeacher(user.id)
    }

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: createdBy,
      action: "CREATE_EMPLOYEE",
      table_name: "employees",
      record_id: user.id,
      new_values: employeeData,
    })

    return true
  } catch (error) {
    console.error("Error creating employee:", error)
    return false
  }
}

async function createMonthlyRequirementsForTeacher(employeeId: string) {
  const requirements = []
  const currentDate = new Date()

  // Create requirements for current month and next 11 months (1 year ahead)
  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth() + 1 // JavaScript months are 0-indexed

    // Due date is the 10th of each month
    const dueDate = new Date(year, month - 1, 10)

    requirements.push({
      employee_id: employeeId,
      year,
      month,
      due_date: dueDate.toISOString().split("T")[0],
      status: dueDate < currentDate ? "overdue" : "pending",
    })
  }

  await supabase.from("monthly_file_requirements").insert(requirements)
}

export async function updateEmployee(
  employeeId: string,
  updateData: UpdateEmployeeData,
  updatedBy: string,
): Promise<boolean> {
  try {
    // Get current employee data
    const { data: currentEmployee, error: fetchError } = await supabase
      .from("employees")
      .select(`
        *,
        users!inner(*)
      `)
      .eq("id", employeeId)
      .single()

    if (fetchError || !currentEmployee) {
      console.error("Error fetching employee:", fetchError)
      return false
    }

    // Update user data if provided
    if (updateData.name || updateData.email) {
      const userUpdates: any = {}
      if (updateData.name) userUpdates.name = updateData.name
      if (updateData.email) userUpdates.email = updateData.email

      const { error: userError } = await supabase.from("users").update(userUpdates).eq("id", currentEmployee.user_id)

      if (userError) {
        console.error("Error updating user:", userError)
        return false
      }
    }

    // Update employee data
    const employeeUpdates: any = {}
    if (updateData.employee_number) employeeUpdates.employee_number = updateData.employee_number
    if (updateData.department) employeeUpdates.department = updateData.department
    if (updateData.position) employeeUpdates.position = updateData.position
    if (updateData.hire_date) employeeUpdates.hire_date = updateData.hire_date
    if (updateData.category) employeeUpdates.category = updateData.category
    if (updateData.is_active !== undefined) employeeUpdates.is_active = updateData.is_active

    if (Object.keys(employeeUpdates).length > 0) {
      const { error: employeeError } = await supabase.from("employees").update(employeeUpdates).eq("id", employeeId)

      if (employeeError) {
        console.error("Error updating employee:", employeeError)
        return false
      }
    }

    // If category changed to teacher, create monthly requirements
    if (updateData.category === "teacher" && currentEmployee.category !== "teacher") {
      await createMonthlyRequirementsForTeacher(employeeId)
    }

    // If category changed from teacher, remove monthly requirements
    if (currentEmployee.category === "teacher" && updateData.category && updateData.category !== "teacher") {
      await supabase.from("monthly_file_requirements").delete().eq("employee_id", employeeId)
    }

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: updatedBy,
      action: "UPDATE_EMPLOYEE",
      table_name: "employees",
      record_id: employeeId,
      old_values: {
        name: currentEmployee.users.name,
        email: currentEmployee.users.email,
        employee_number: currentEmployee.employee_number,
        department: currentEmployee.department,
        position: currentEmployee.position,
        hire_date: currentEmployee.hire_date,
        category: currentEmployee.category,
        is_active: currentEmployee.is_active,
      },
      new_values: updateData,
    })

    return true
  } catch (error) {
    console.error("Error updating employee:", error)
    return false
  }
}

export async function deleteEmployee(employeeId: string, deletedBy: string): Promise<boolean> {
  try {
    // Get employee data before deletion for logging
    const { data: employee, error: fetchError } = await supabase
      .from("employees")
      .select(`
        *,
        users!inner(*)
      `)
      .eq("id", employeeId)
      .single()

    if (fetchError || !employee) {
      console.error("Error fetching employee:", fetchError)
      return false
    }

    // Soft delete - just mark as inactive
    const { error: updateError } = await supabase.from("employees").update({ is_active: false }).eq("id", employeeId)

    if (updateError) {
      console.error("Error deactivating employee:", updateError)
      return false
    }

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: deletedBy,
      action: "DELETE_EMPLOYEE",
      table_name: "employees",
      record_id: employeeId,
      old_values: {
        name: employee.users.name,
        email: employee.users.email,
        employee_number: employee.employee_number,
      },
    })

    return true
  } catch (error) {
    console.error("Error deleting employee:", error)
    return false
  }
}

export async function getAllEmployees(includeInactive = false): Promise<Employee[]> {
  try {
    let query = supabase
      .from("employees")
      .select(`
        *,
        users!inner(*)
      `)
      .order("employee_number")

    if (!includeInactive) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching employees:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching employees:", error)
    return []
  }
}

export async function getEmployeeStats(): Promise<{
  totalEmployees: number
  regularEmployees: number
  outsourcedEmployees: number
  teacherEmployees: number
  inactiveEmployees: number
}> {
  try {
    const { data: employees } = await supabase.from("employees").select("category, is_active")

    if (!employees) {
      return {
        totalEmployees: 0,
        regularEmployees: 0,
        outsourcedEmployees: 0,
        teacherEmployees: 0,
        inactiveEmployees: 0,
      }
    }

    const totalEmployees = employees.length
    const regularEmployees = employees.filter((e) => e.category === "regular" && e.is_active).length
    const outsourcedEmployees = employees.filter((e) => e.category === "outsourced" && e.is_active).length
    const teacherEmployees = employees.filter((e) => e.category === "teacher" && e.is_active).length
    const inactiveEmployees = employees.filter((e) => !e.is_active).length

    return {
      totalEmployees,
      regularEmployees,
      outsourcedEmployees,
      teacherEmployees,
      inactiveEmployees,
    }
  } catch (error) {
    console.error("Error fetching employee stats:", error)
    return { totalEmployees: 0, regularEmployees: 0, outsourcedEmployees: 0, teacherEmployees: 0, inactiveEmployees: 0 }
  }
}
