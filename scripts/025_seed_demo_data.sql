-- Insert demo users
INSERT INTO users (email, name, password_hash, role) VALUES
('admin@ceiromao.com', 'Administrator', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('employee@ceiromao.com', 'Employee User', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('maria@ceiromao.com', 'Maria Silva', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('carlos@ceiromao.com', 'Carlos Santos', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
('ana@ceiromao.com', 'Ana Costa', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert demo employees
INSERT INTO employees (employee_number, name, department, position, hire_date, status, category) VALUES
('EMP001', 'Maria Silva', 'Education', 'Mathematics Teacher', '2023-01-15', 'active', 'teacher'),
('EMP002', 'Carlos Santos', 'Education', 'Science Teacher', '2023-02-01', 'active', 'teacher'),
('EMP003', 'Ana Costa', 'Education', 'English Teacher', '2023-03-10', 'active', 'teacher'),
('EMP004', 'João Oliveira', 'Administration', 'HR Manager', '2022-05-20', 'active', 'regular'),
('EMP005', 'Sofia Pereira', 'IT', 'System Administrator', '2022-08-15', 'active', 'regular'),
('EMP006', 'Pedro Rodrigues', 'Maintenance', 'Janitor', '2023-01-01', 'active', 'outsourced'),
('EMP007', 'Lucia Fernandes', 'Education', 'History Teacher', '2023-04-01', 'active', 'teacher'),
('EMP008', 'Miguel Torres', 'Education', 'Physical Education Teacher', '2023-05-15', 'active', 'teacher')
ON CONFLICT (employee_number) DO NOTHING;

-- Insert some demo attendance records
INSERT INTO attendance (employee_id, date, morning_status, afternoon_status) 
SELECT 
    e.id,
    CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 30),
    CASE WHEN random() < 0.9 THEN 'present' ELSE 'absent' END,
    CASE WHEN random() < 0.9 THEN 'present' ELSE 'absent' END
FROM employees e
WHERE e.category = 'teacher'
ON CONFLICT (employee_id, date) DO NOTHING;
