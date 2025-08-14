import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email: string
  name: string
  password_hash: string
  role: "admin" | "user"
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  employee_number: string
  name: string
  department: string
  position: string
  hire_date: string
  status: "active" | "inactive"
  category: "regular" | "outsourced" | "teacher"
  created_at: string
  updated_at: string
}

export interface ActivityFile {
  id: string
  employee_id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  upload_date: string
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
  activity_file_id?: string
  created_at: string
  updated_at: string
  employee?: Employee
  activity_file?: ActivityFile
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  morning_status: "present" | "absent" | "justified" | "vacation" | "sick_leave"
  afternoon_status: "present" | "absent" | "justified" | "vacation" | "sick_leave"
  created_at: string
  updated_at: string
  employee?: Employee
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_values?: any
  new_values?: any
  created_at: string
}
