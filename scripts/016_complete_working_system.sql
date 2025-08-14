-- Complete working system setup
-- Drop existing tables if they exist
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS activity_files CASCADE;
DROP TABLE IF EXISTS attendance_justifications CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    hire_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    category VARCHAR(50) NOT NULL DEFAULT 'regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('morning', 'afternoon')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date, period)
);

-- Create attendance justifications table
CREATE TABLE attendance_justifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE,
    justification_type VARCHAR(50) NOT NULL,
    justification_text TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity files table
CREATE TABLE activity_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    requirement_type VARCHAR(100) NOT NULL,
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo users
INSERT INTO users (id, email, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@ceiromao.com', 'Admin User', 'admin'),
('550e8400-e29b-41d4-a716-446655440002', 'hr@ceiromao.com', 'HR Manager', 'hr'),
('550e8400-e29b-41d4-a716-446655440003', 'teacher@ceiromao.com', 'Teacher User', 'teacher'),
('550e8400-e29b-41d4-a716-446655440004', 'john.doe@ceiromao.com', 'John Doe', 'teacher'),
('550e8400-e29b-41d4-a716-446655440005', 'jane.smith@ceiromao.com', 'Jane Smith', 'teacher'),
('550e8400-e29b-41d4-a716-446655440006', 'mike.johnson@ceiromao.com', 'Mike Johnson', 'user'),
('550e8400-e29b-41d4-a716-446655440007', 'sarah.wilson@ceiromao.com', 'Sarah Wilson', 'user'),
('550e8400-e29b-41d4-a716-446655440008', 'david.brown@ceiromao.com', 'David Brown', 'teacher');

-- Insert demo employees
INSERT INTO employees (id, user_id, employee_number, name, position, department, hire_date, status, category) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'EMP001', 'John Doe', 'Math Teacher', 'Mathematics', '2023-01-15', 'active', 'teacher'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 'EMP002', 'Jane Smith', 'English Teacher', 'Languages', '2023-02-01', 'active', 'teacher'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006', 'EMP003', 'Mike Johnson', 'Administrative Assistant', 'Administration', '2023-03-10', 'active', 'regular'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007', 'EMP004', 'Sarah Wilson', 'Science Teacher', 'Sciences', '2023-04-05', 'active', 'teacher'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440008', 'EMP005', 'David Brown', 'History Teacher', 'Social Studies', '2023-05-20', 'active', 'teacher'),
('660e8400-e29b-41d4-a716-446655440006', NULL, 'EMP006', 'Maria Garcia', 'Cleaning Staff', 'Maintenance', '2023-06-01', 'active', 'outsourced'),
('660e8400-e29b-41d4-a716-446655440007', NULL, 'EMP007', 'Carlos Rodriguez', 'Security Guard', 'Security', '2023-07-15', 'active', 'outsourced'),
('660e8400-e29b-41d4-a716-446655440008', NULL, 'EMP008', 'Ana Silva', 'PE Teacher', 'Physical Education', '2023-08-01', 'inactive', 'teacher');

-- Insert demo attendance records
INSERT INTO attendance (employee_id, date, period, status, marked_by) VALUES
('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 'morning', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 'afternoon', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'morning', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'afternoon', 'absent', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 'morning', 'late', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 'afternoon', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, 'morning', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, 'afternoon', 'present', '550e8400-e29b-41d4-a716-446655440001');

-- Insert demo activity files
INSERT INTO activity_files (employee_id, file_name, file_type, requirement_type, due_date, status) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'lesson_plan_q1.pdf', 'PDF', 'Lesson Plan', CURRENT_DATE + INTERVAL '7 days', 'pending'),
('660e8400-e29b-41d4-a716-446655440001', 'student_grades_q1.xlsx', 'Excel', 'Grade Report', CURRENT_DATE + INTERVAL '14 days', 'pending'),
('660e8400-e29b-41d4-a716-446655440002', 'curriculum_outline.docx', 'Word', 'Curriculum', CURRENT_DATE - INTERVAL '2 days', 'overdue'),
('660e8400-e29b-41d4-a716-446655440004', 'lab_safety_report.pdf', 'PDF', 'Safety Report', CURRENT_DATE + INTERVAL '5 days', 'pending'),
('660e8400-e29b-41d4-a716-446655440005', 'field_trip_proposal.pdf', 'PDF', 'Trip Proposal', CURRENT_DATE + INTERVAL '10 days', 'submitted');

-- Insert demo activity logs
INSERT INTO activity_logs (user_id, action, details) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Login', 'Admin user logged in'),
('550e8400-e29b-41d4-a716-446655440002', 'View Employees', 'HR manager viewed employee list'),
('550e8400-e29b-41d4-a716-446655440003', 'Upload File', 'Teacher uploaded lesson plan'),
('550e8400-e29b-41d4-a716-446655440001', 'Mark Attendance', 'Marked attendance for John Doe'),
('550e8400-e29b-41d4-a716-446655440002', 'Generate Report', 'Generated monthly attendance report');

-- Create indexes for better performance
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_category ON employees(category);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_activity_files_employee ON activity_files(employee_id);
CREATE INDEX idx_activity_files_due_date ON activity_files(due_date);
