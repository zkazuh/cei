-- Complete working system setup
-- Drop existing tables if they exist
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS activity_files CASCADE;
DROP TABLE IF EXISTS attendance_justifications CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS monthly_file_requirements CASCADE;
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
    department VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    category VARCHAR(20) DEFAULT 'regular' CHECK (category IN ('regular', 'teacher', 'outsourced')),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period VARCHAR(20) DEFAULT 'morning' CHECK (period IN ('morning', 'afternoon')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date, period)
);

-- Create attendance justifications table
CREATE TABLE attendance_justifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    justification_type VARCHAR(50) NOT NULL CHECK (justification_type IN ('medical', 'justified', 'banked_hours', 'other', 'course', 'recess', 'meeting')),
    justification_text TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attendance_id)
);

-- Create activity files table
CREATE TABLE activity_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    file_type VARCHAR(50),
    requirement_type VARCHAR(100) NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo users
INSERT INTO users (id, email, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@ceiromao.com', 'Administrator', 'admin'),
('550e8400-e29b-41d4-a716-446655440002', 'hr@ceiromao.com', 'HR Manager', 'hr'),
('550e8400-e29b-41d4-a716-446655440003', 'teacher@ceiromao.com', 'Teacher User', 'teacher');

-- Insert demo employees
INSERT INTO employees (id, user_id, employee_number, name, department, position, hire_date, status, category, phone, email) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'EMP001', 'João Silva', 'Administration', 'Administrator', '2020-01-15', 'active', 'regular', '(11) 99999-0001', 'joao.silva@ceiromao.com'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'EMP002', 'Maria Santos', 'Human Resources', 'HR Manager', '2020-03-10', 'active', 'regular', '(11) 99999-0002', 'maria.santos@ceiromao.com'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'TCH001', 'Ana Costa', 'Education', 'Mathematics Teacher', '2021-02-01', 'active', 'teacher', '(11) 99999-0003', 'ana.costa@ceiromao.com'),
('650e8400-e29b-41d4-a716-446655440004', NULL, 'TCH002', 'Carlos Oliveira', 'Education', 'Portuguese Teacher', '2021-03-15', 'active', 'teacher', '(11) 99999-0004', 'carlos.oliveira@ceiromao.com'),
('650e8400-e29b-41d4-a716-446655440005', NULL, 'TCH003', 'Lucia Ferreira', 'Education', 'Science Teacher', '2021-05-20', 'active', 'teacher', '(11) 99999-0005', 'lucia.ferreira@ceiromao.com'),
('650e8400-e29b-41d4-a716-446655440006', NULL, 'REG001', 'Pedro Almeida', 'Maintenance', 'Janitor', '2020-06-01', 'active', 'regular', '(11) 99999-0006', 'pedro.almeida@ceiromao.com'),
('650e8400-e29b-41d4-a716-446655440007', NULL, 'REG002', 'Sofia Lima', 'Kitchen', 'Cook', '2020-08-15', 'active', 'regular', '(11) 99999-0007', 'sofia.lima@ceiromao.com'),
('650e8400-e29b-41d4-a716-446655440008', NULL, 'OUT001', 'Roberto Silva', 'Security', 'Security Guard', '2022-01-10', 'active', 'outsourced', '(11) 99999-0008', 'roberto.silva@security.com'),
('650e8400-e29b-41d4-a716-446655440009', NULL, 'OUT002', 'Fernanda Costa', 'Cleaning', 'Cleaner', '2022-02-15', 'active', 'outsourced', '(11) 99999-0009', 'fernanda.costa@cleaning.com');

-- Insert sample attendance data
INSERT INTO attendance (employee_id, date, period, status, marked_by) VALUES
('650e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 'morning', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'morning', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 'morning', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, 'morning', 'absent', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440005', CURRENT_DATE, 'morning', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440006', CURRENT_DATE, 'morning', 'present', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440007', CURRENT_DATE, 'morning', 'late', '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample activity files
INSERT INTO activity_files (employee_id, file_name, requirement_type, month, year, due_date, status) VALUES
('650e8400-e29b-41d4-a716-446655440003', 'monthly_activities_jan_2024.pdf', 'Monthly Activity Report', 1, 2024, '2024-02-10', 'submitted'),
('650e8400-e29b-41d4-a716-446655440004', 'monthly_activities_jan_2024.pdf', 'Monthly Activity Report', 1, 2024, '2024-02-10', 'pending'),
('650e8400-e29b-41d4-a716-446655440005', 'monthly_activities_jan_2024.pdf', 'Monthly Activity Report', 1, 2024, '2024-02-10', 'submitted'),
('650e8400-e29b-41d4-a716-446655440003', 'monthly_activities_feb_2024.pdf', 'Monthly Activity Report', 2, 2024, '2024-03-10', 'pending'),
('650e8400-e29b-41d4-a716-446655440004', 'monthly_activities_feb_2024.pdf', 'Monthly Activity Report', 2, 2024, '2024-03-10', 'pending'),
('650e8400-e29b-41d4-a716-446655440005', 'monthly_activities_feb_2024.pdf', 'Monthly Activity Report', 2, 2024, '2024-03-10', 'pending');

-- Create indexes for better performance
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_category ON employees(category);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_activity_files_employee ON activity_files(employee_id);
CREATE INDEX idx_activity_files_status ON activity_files(status);
