import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          password_hash: string
          role: "admin" | "user"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          password_hash: string
          role?: "admin" | "user"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password_hash?: string
          role?: "admin" | "user"
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          employee_number: string
          name: string
          category: "regular" | "outsourced" | "teacher"
          status: "active" | "inactive"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_number: string
          name: string
          category?: "regular" | "outsourced" | "teacher"
          status?: "active" | "inactive"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_number?: string
          name?: string
          category?: "regular" | "outsourced" | "teacher"
          status?: "active" | "inactive"
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          employee_id: string
          date: string
          morning_status: "present" | "absent" | "justified" | "vacation" | "sick_leave"
          afternoon_status: "present" | "absent" | "justified" | "vacation" | "sick_leave"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          date: string
          morning_status: "present" | "absent" | "justified" | "vacation" | "sick_leave"
          afternoon_status: "present" | "absent" | "justified" | "vacation" | "sick_leave"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          date?: string
          morning_status?: "present" | "absent" | "justified" | "vacation" | "sick_leave"
          afternoon_status?: "present" | "absent" | "justified" | "vacation" | "sick_leave"
          created_at?: string
          updated_at?: string
        }
      }
      activity_files: {
        Row: {
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
        Insert: {
          id?: string
          employee_id: string
          filename: string
          file_path: string
          file_size: number
          mime_type: string
          upload_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          filename?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          upload_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      monthly_file_requirements: {
        Row: {
          id: string
          employee_id: string
          year: number
          month: number
          due_date: string
          status: "pending" | "submitted" | "overdue"
          submitted_at: string | null
          activity_file_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          year: number
          month: number
          due_date: string
          status?: "pending" | "submitted" | "overdue"
          submitted_at?: string | null
          activity_file_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          year?: number
          month?: number
          due_date?: string
          status?: "pending" | "submitted" | "overdue"
          submitted_at?: string | null
          activity_file_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values: any
          new_values: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: any
          new_values?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_values?: any
          new_values?: any
          created_at?: string
        }
      }
    }
    Functions: {
      create_monthly_requirements_for_teachers: {
        Args: {
          target_year: number
          target_month: number
        }
        Returns: number
      }
      update_overdue_requirements: {
        Args: {}
        Returns: number
      }
    }
  }
}

export type User = Database["public"]["Tables"]["users"]["Row"]
export type Employee = Database["public"]["Tables"]["employees"]["Row"]
export type MonthlyFileRequirement = Database["public"]["Tables"]["monthly_file_requirements"]["Row"]
export type ActivityFile = Database["public"]["Tables"]["activity_files"]["Row"]
export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"]
