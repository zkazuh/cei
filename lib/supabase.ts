import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "employee"
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  user_id: string
  employee_number: string
  department: string | null
  position: string | null
  hire_date: string | null
  category: "regular" | "outsourced" | "teacher"
  is_active: boolean
  created_at: string
  updated_at: string
  users?: User
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  period: "morning" | "afternoon"
  status: "present" | "absent"
  marked_by: string
  created_at: string
  updated_at: string
  employees?: Employee
  attendance_justifications?: AttendanceJustification[]
}

export interface AttendanceJustification {
  id: string
  attendance_id: string
  justification_type: "medical" | "justified" | "banked_hours" | "other" | "course" | "recess" | "meeting"
  justification_text: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ActivityFile {
  id: string
  employee_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  status: "pending" | "approved" | "rejected"
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  employees?: Employee
}

export interface MonthlyFileRequirement {
  id: string
  employee_id: string
  year: number
  month: number
  due_date: string
  status: "pending" | "submitted" | "overdue"
  submitted_file_id: string | null
  created_at: string
  updated_at: string
  employees?: Employee & { users: User }
  activity_files?: ActivityFile
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string | null
  old_values: any
  new_values: any
  created_at: string
}
