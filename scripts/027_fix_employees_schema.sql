-- Drop and recreate employees table with correct structure
DROP TABLE IF EXISTS monthly_file_requirements CASCADE;
DROP TABLE IF EXISTS activity_files CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- Create employees table with all required columns
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

-- Create indexes
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_category ON employees(category);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_monthly_requirements_employee ON monthly_file_requirements(employee_id);
CREATE INDEX idx_monthly_requirements_date ON monthly_file_requirements(year, month);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_activity_files_employee ON activity_files(employee_id);

-- Insert sample employees
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
('EMP010', 'Sofia Pereira', 'HR', 'Specialist', '2021-01-25', 'active', 'regular');

-- Create monthly file requirements for teachers
INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status)
SELECT 
    e.id,
    2024,
    generate_series(1, 12),
    make_date(2024, generate_series(1, 12), 15),
    CASE 
        WHEN generate_series(1, 12) <= EXTRACT(month FROM CURRENT_DATE) - 1 THEN 'submitted'
        WHEN generate_series(1, 12) = EXTRACT(month FROM CURRENT_DATE) THEN 'pending'
        ELSE 'pending'
    END
FROM employees e
WHERE e.category = 'teacher';
