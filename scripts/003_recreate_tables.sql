-- Drop existing tables if they exist (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS activity_files CASCADE;
DROP TABLE IF EXISTS attendance_justifications CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create users table for authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'employee')) NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create employees table for HR data
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE NOT NULL,
  department TEXT,
  position TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent')) NOT NULL,
  marked_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(employee_id, date)
);

-- Create attendance justifications table
CREATE TABLE attendance_justifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE NOT NULL,
  justification_type TEXT CHECK (justification_type IN ('medical', 'justified', 'banked_hours', 'other')) NOT NULL,
  justification_text TEXT NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Create activity files table
CREATE TABLE activity_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create activity logs table for audit trail
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_employee_number ON employees(employee_number);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_justifications_attendance_id ON attendance_justifications(attendance_id);
CREATE INDEX idx_activity_files_employee_id ON activity_files(employee_id);
CREATE INDEX idx_activity_files_status ON activity_files(status);
CREATE INDEX idx_activity_files_created_at ON activity_files(created_at);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_table_name ON activity_logs(table_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON employees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at 
  BEFORE UPDATE ON attendance 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_justifications_updated_at 
  BEFORE UPDATE ON attendance_justifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_files_updated_at 
  BEFORE UPDATE ON activity_files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
