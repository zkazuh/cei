import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  username: string
  password_hash: string
  role: string
  created_at: string
}

export interface Employee {
  id: string
  name: string
  position: string
  department: string
  hire_date: string
  status: "active" | "inactive"
  category: "regular" | "outsourced" | "teacher"
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  status: "present" | "absent" | "late" | "justified"
  check_in_time?: string
  check_out_time?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface AttendanceJustification {
  id: string
  attendance_id: string
  reason: string
  justification_type: "medical" | "personal" | "official" | "other"
  supporting_document?: string
  approved_by?: string
  approved_at?: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export interface ActivityFile {
  id: string
  employee_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  upload_date: string
  description?: string
  status: "pending" | "approved" | "rejected"
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  employee_id: string
  activity_type: string
  description: string
  hours_logged: number
  date: string
  status: "pending" | "approved" | "rejected"
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface MonthlyFileRequirement {
  id: string
  employee_id: string
  year: number
  month: number
  due_date: string
  status: "pending" | "submitted" | "overdue"
  submitted_at?: string
  file_id?: string
  created_at: string
  updated_at: string
}

// Helper types for joins
export interface EmployeeWithAttendance extends Employee {
  attendance?: Attendance[]
}

export interface AttendanceWithEmployee extends Attendance {
  employee?: Employee
}

export interface AttendanceWithJustification extends Attendance {
  justification?: AttendanceJustification
}

export interface ActivityFileWithEmployee extends ActivityFile {
  employee?: Employee
}

export interface ActivityLogWithEmployee extends ActivityLog {
  employee?: Employee
}

export interface MonthlyFileRequirementWithEmployee extends MonthlyFileRequirement {
  employee?: Employee
  file?: ActivityFile
}
