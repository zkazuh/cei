import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
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
  position: string
  department: string
  hire_date: string
  status: string
  category: string
  created_at: string
  updated_at: string
  users?: User
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  period: "morning" | "afternoon"
  status: "present" | "absent" | "late"
  marked_by: string
  created_at: string
  updated_at: string
  attendance_justifications?: AttendanceJustification[]
}

export interface AttendanceJustification {
  id: string
  attendance_id: string
  justification_type: string
  justification_text: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ActivityFile {
  id: string
  employee_id: string
  file_name: string
  file_type: string
  requirement_type: string
  due_date?: string
  status: string
  submitted_at?: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  details?: string
  created_at: string
}
