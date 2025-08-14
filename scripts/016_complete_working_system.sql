-- Complete working system setup - Version 16
-- Drop existing tables if they exist
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS activity_files CASCADE;
DROP TABLE IF EXISTS monthly_file_requirements CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employees table with correct structure
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    category VARCHAR(20) NOT NULL DEFAULT 'regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Create activity_files table
CREATE TABLE activity_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly_file_requirements table
CREATE TABLE monthly_file_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE,
    activity_file_id UUID REFERENCES activity_files(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, year, month)
);

-- Create activity_logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo users
INSERT INTO users (email, password_hash, role) VALUES
('admin@ceiromao.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('hr@ceiromao.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hr'),
('teacher@ceiromao.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher');

-- Insert demo employees
INSERT INTO employees (name, employee_number, department, position, hire_date, status, category) VALUES
('Maria Silva', 'EMP001', 'Education', 'Mathematics Teacher', '2023-01-15', 'active', 'teacher'),
('João Santos', 'EMP002', 'Education', 'Portuguese Teacher', '2023-02-01', 'active', 'teacher'),
('Ana Costa', 'EMP003', 'Education', 'Science Teacher', '2023-03-10', 'active', 'teacher'),
('Pedro Lima', 'EMP004', 'Administration', 'HR Manager', '2022-08-15', 'active', 'regular'),
('Carla Oliveira', 'EMP005', 'Administration', 'Secretary', '2023-05-20', 'active', 'regular'),
('Roberto Ferreira', 'EMP006', 'Maintenance', 'Janitor', '2023-06-01', 'active', 'outsourced'),
('Lucia Mendes', 'EMP007', 'Education', 'History Teacher', '2023-07-15', 'active', 'teacher'),
('Carlos Rodrigues', 'EMP008', 'Administration', 'Accountant', '2023-04-10', 'active', 'regular');

-- Insert sample attendance data (fixed CASE statement)
DO $$
DECLARE
    emp_record RECORD;
    day_offset INTEGER;
    random_val FLOAT;
BEGIN
    FOR emp_record IN SELECT id FROM employees WHERE status = 'active' LOOP
        FOR day_offset IN 0..29 LOOP
            random_val := random();
            INSERT INTO attendance (employee_id, date, status, hours_worked) VALUES (
                emp_record.id,
                CURRENT_DATE - INTERVAL '1 day' * day_offset,
                CASE 
                    WHEN random_val < 0.1 THEN 'absent'
                    WHEN random_val < 0.15 THEN 'late'
                    ELSE 'present'
                END,
                CASE 
                    WHEN random_val < 0.1 THEN 0
                    WHEN random_val < 0.15 THEN 6
                    ELSE 8
                END
            );
        END LOOP;
    END LOOP;
END $$;

-- Insert sample monthly requirements for teachers (fixed CASE statement)
DO $$
DECLARE
    emp_record RECORD;
    month_num INTEGER;
    random_val FLOAT;
BEGIN
    FOR emp_record IN SELECT id FROM employees WHERE category = 'teacher' AND status = 'active' LOOP
        FOR month_num IN 1..12 LOOP
            random_val := random();
            INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status) VALUES (
                emp_record.id,
                2024,
                month_num,
                make_date(2024, month_num, 15),
                CASE 
                    WHEN month_num < EXTRACT(month FROM CURRENT_DATE) THEN 
                        CASE WHEN random_val < 0.7 THEN 'submitted' ELSE 'overdue' END
                    ELSE 'pending'
                END
            );
        END LOOP;
    END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_category ON employees(category);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_monthly_requirements_employee ON monthly_file_requirements(employee_id);
CREATE INDEX idx_monthly_requirements_year_month ON monthly_file_requirements(year, month);
CREATE INDEX idx_activity_files_employee ON activity_files(employee_id);
