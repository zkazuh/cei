import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  email: string
  role: "admin" | "employee" | "teacher"
  name: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  name: string
  employee_number: string
  position: string
  department: string
  hire_date: string
  status: "active" | "inactive"
  category: "regular" | "outsourced" | "teacher"
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  status: "present" | "absent" | "late" | "justified"
  check_in_time?: string
  check_out_time?: string
  hours_worked?: number
  notes?: string
  created_at: string
  updated_at: string
  employee?: Employee
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
  employee?: Employee
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

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  details: string
  created_at: string
  user?: User
}
