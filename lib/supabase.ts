import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  user_id?: string
  employee_number: string
  name: string
  department?: string
  position?: string
  hire_date: string
  status: "active" | "inactive"
  category: "regular" | "teacher" | "outsourced"
  phone?: string
  email?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  period: "morning" | "afternoon"
  status: "present" | "absent" | "late"
  marked_by?: string
  created_at: string
  updated_at: string
  employees?: Employee
  attendance_justifications?: AttendanceJustification[]
}

export interface AttendanceJustification {
  id: string
  attendance_id: string
  justification_type: "medical" | "justified" | "banked_hours" | "other" | "course" | "recess" | "meeting"
  justification_text?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ActivityFile {
  id: string
  employee_id: string
  file_name: string
  file_path?: string
  file_size?: number
  file_type?: string
  requirement_type: string
  month: number
  year: number
  due_date: string
  status: "pending" | "submitted" | "approved" | "rejected"
  submitted_at?: string
  submitted_by?: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id?: string
  action: string
  table_name?: string
  record_id?: string
  old_values?: any
  new_values?: any
  created_at: string
}

export interface MonthlyFileRequirement {
  id: string
  employee_id: string
  month: number
  year: number
  due_date: string
  status: "pending" | "submitted" | "overdue"
  submitted_at?: string
  created_at: string
  updated_at: string
}
