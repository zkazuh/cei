-- Insert demo users
INSERT INTO users (id, email, password_hash, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'HR Administrator', 'admin'),
('550e8400-e29b-41d4-a716-446655440001', 'employee@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'John Employee', 'employee'),
('550e8400-e29b-41d4-a716-446655440002', 'maria@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Maria Silva', 'employee'),
('550e8400-e29b-41d4-a716-446655440003', 'carlos@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Carlos Santos', 'employee'),
('550e8400-e29b-41d4-a716-446655440004', 'ana@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Ana Costa', 'employee'),
('550e8400-e29b-41d4-a716-446655440005', 'pedro@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Pedro Lima', 'employee'),
('550e8400-e29b-41d4-a716-446655440006', 'sofia@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Sofia Oliveira', 'employee');

-- Insert employees
INSERT INTO employees (id, user_id, employee_number, department, position, hire_date) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'EMP001', 'Development', 'Software Developer', '2023-01-15'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'EMP002', 'Design', 'UI/UX Designer', '2023-02-01'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'EMP003', 'Development', 'Backend Developer', '2023-03-10'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'EMP004', 'Marketing', 'Marketing Specialist', '2023-04-01'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'EMP005', 'Development', 'Frontend Developer', '2023-05-15'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'EMP006', 'Design', 'Graphic Designer', '2023-06-01');

-- Insert today's attendance
INSERT INTO attendance (employee_id, date, status, marked_by) VALUES
('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 'absent', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440005', CURRENT_DATE, 'absent', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440006', CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440000');

-- Insert justifications for absences
INSERT INTO attendance_justifications (attendance_id, justification_type, justification_text, created_by)
SELECT 
  a.id,
  'medical',
  'Medical appointment',
  '550e8400-e29b-41d4-a716-446655440000'
FROM attendance a
JOIN employees e ON a.employee_id = e.id
JOIN users u ON e.user_id = u.id
WHERE a.status = 'absent' AND u.name = 'Carlos Santos' AND a.date = CURRENT_DATE;
