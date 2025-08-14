-- Complete database reset and recreation
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS monthly_file_requirements CASCADE;
DROP TABLE IF EXISTS activity_files CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employees table with correct structure
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    hire_date DATE NOT NULL,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    category TEXT CHECK (category IN ('regular', 'outsourced', 'teacher')) DEFAULT 'regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity files table
CREATE TABLE activity_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly file requirements table
CREATE TABLE monthly_file_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    due_date DATE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'submitted', 'overdue')) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE,
    activity_file_id UUID REFERENCES activity_files(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, year, month)
);

-- Create attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    morning_status TEXT CHECK (morning_status IN ('present', 'absent', 'justified', 'vacation', 'sick_leave')) DEFAULT 'present',
    afternoon_status TEXT CHECK (afternoon_status IN ('present', 'absent', 'justified', 'vacation', 'sick_leave')) DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Create activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_category ON employees(category);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_monthly_requirements_employee ON monthly_file_requirements(employee_id);
CREATE INDEX idx_monthly_requirements_date ON monthly_file_requirements(year, month);
CREATE INDEX idx_monthly_requirements_status ON monthly_file_requirements(status);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_activity_files_employee ON activity_files(employee_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_table ON activity_logs(table_name);

-- Insert demo users
INSERT INTO users (email, name, password_hash, role) VALUES
('admin@ceiromao.com', 'Administrator', '$2b$10$hash1', 'admin'),
('employee@ceiromao.com', 'Employee User', '$2b$10$hash2', 'user'),
('maria@ceiromao.com', 'Maria Santos', '$2b$10$hash3', 'user');

-- Insert sample employees with all required columns
INSERT INTO employees (employee_number, name, department, position, hire_date, status, category) VALUES
('EMP001', 'João Silva', 'Administration', 'Manager', '2020-01-15', 'active', 'regular'),
('EMP002', 'Maria Santos', 'Education', 'Teacher', '2019-03-10', 'active', 'teacher'),
('EMP003', 'Carlos Oliveira', 'IT', 'Developer', '2021-06-01', 'active', 'regular'),
('EMP004', 'Ana Costa', 'Education', 'Teacher', '2018-08-20', 'active', 'teacher'),
('EMP005', 'Pedro Ferreira', 'Maintenance', 'Technician', '2022-02-14', 'active', 'outsourced'),
('EMP006', 'Lucia Rodrigues', 'Education', 'Teacher', '2017-09-05', 'active', 'teacher'),
('EMP007', 'Roberto Lima', 'Security', 'Guard', '2020-11-30', 'inactive', 'outsourced'),
('EMP008', 'Fernanda Alves', 'Administration', 'Secretary', '2019-07-12', 'active', 'regular'),
('EMP009', 'Miguel Torres', 'Education', 'Coordinator', '2016-04-18', 'active', 'regular'),
('EMP010', 'Sofia Pereira', 'HR', 'Specialist', '2021-01-25', 'active', 'regular'),
('EMP011', 'Ricardo Mendes', 'Education', 'Teacher', '2020-09-01', 'active', 'teacher'),
('EMP012', 'Patricia Gomes', 'Cleaning', 'Cleaner', '2021-03-15', 'active', 'outsourced');

-- Create monthly file requirements for teachers (current year)
INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status)
SELECT 
    e.id,
    2024,
    generate_series(1, 12) as month_num,
    make_date(2024, generate_series(1, 12), 15) as due_date,
    CASE 
        WHEN generate_series(1, 12) <= EXTRACT(month FROM CURRENT_DATE) - 1 THEN 'submitted'
        WHEN generate_series(1, 12) = EXTRACT(month FROM CURRENT_DATE) THEN 'pending'
        ELSE 'pending'
    END as status
FROM employees e
WHERE e.category = 'teacher';

-- Create some sample attendance records
INSERT INTO attendance (employee_id, date, morning_status, afternoon_status)
SELECT 
    e.id,
    CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 30),
    CASE 
        WHEN random() < 0.9 THEN 'present'
        WHEN random() < 0.95 THEN 'justified'
        ELSE 'absent'
    END,
    CASE 
        WHEN random() < 0.9 THEN 'present'
        WHEN random() < 0.95 THEN 'justified'
        ELSE 'absent'
    END
FROM employees e
WHERE e.status = 'active';

-- Create functions for monthly requirements management
CREATE OR REPLACE FUNCTION create_monthly_requirements_for_teachers(target_year INTEGER, target_month INTEGER)
RETURNS INTEGER AS $$
DECLARE
    teacher_count INTEGER := 0;
BEGIN
    INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status)
    SELECT 
        e.id,
        target_year,
        target_month,
        make_date(target_year, target_month, 15),
        'pending'
    FROM employees e
    WHERE e.category = 'teacher' 
    AND e.status = 'active'
    AND NOT EXISTS (
        SELECT 1 FROM monthly_file_requirements mfr 
        WHERE mfr.employee_id = e.id 
        AND mfr.year = target_year 
        AND mfr.month = target_month
    );
    
    GET DIAGNOSTICS teacher_count = ROW_COUNT;
    RETURN teacher_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_overdue_requirements()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE monthly_file_requirements 
    SET status = 'overdue'
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
