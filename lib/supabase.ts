import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface User {
  id: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  name: string
  employee_number: string
  department: string
  position: string
  hire_date: string
  status: string
  category: string
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  status: string
  hours_worked: number
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
  status: string
  submitted_at?: string
  activity_file_id?: string
  created_at: string
  updated_at: string
  employee?: Employee
  activity_file?: ActivityFile
}

export interface ActivityLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  details?: any
  created_at: string
}
