-- Insert demo users
INSERT INTO users (id, email, name, password_hash, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@ceiromao.com', 'Administrator', '$2b$10$hash', 'admin'),
('550e8400-e29b-41d4-a716-446655440002', 'employee@ceiromao.com', 'Employee User', '$2b$10$hash', 'user'),
('550e8400-e29b-41d4-a716-446655440003', 'maria@ceiromao.com', 'Maria Silva', '$2b$10$hash', 'user'),
('550e8400-e29b-41d4-a716-446655440004', 'carlos@ceiromao.com', 'Carlos Santos', '$2b$10$hash', 'user'),
('550e8400-e29b-41d4-a716-446655440005', 'ana@ceiromao.com', 'Ana Costa', '$2b$10$hash', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert demo employees
INSERT INTO employees (id, employee_number, name, department, position, hire_date, status, category) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'EMP001', 'Maria Silva', 'Education', 'Math Teacher', '2023-01-15', 'active', 'teacher'),
('660e8400-e29b-41d4-a716-446655440002', 'EMP002', 'Carlos Santos', 'Education', 'Science Teacher', '2023-02-01', 'active', 'teacher'),
('660e8400-e29b-41d4-a716-446655440003', 'EMP003', 'Ana Costa', 'Education', 'English Teacher', '2023-03-10', 'active', 'teacher'),
('660e8400-e29b-41d4-a716-446655440004', 'EMP004', 'Pedro Lima', 'Administration', 'HR Manager', '2023-04-01', 'active', 'regular'),
('660e8400-e29b-41d4-a716-446655440005', 'EMP005', 'Sofia Oliveira', 'IT', 'Developer', '2023-05-15', 'active', 'outsourced'),
('660e8400-e29b-41d4-a716-446655440006', 'EMP006', 'João Pereira', 'Education', 'History Teacher', '2023-06-01', 'active', 'teacher')
ON CONFLICT (employee_number) DO NOTHING;

-- Create monthly requirements for current month
INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status) 
SELECT 
    id,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '9 days', -- Due on 10th of month
    'pending'
FROM employees 
WHERE category = 'teacher' AND status = 'active'
ON CONFLICT (employee_id, year, month) DO NOTHING;
