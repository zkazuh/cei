-- Add some outsourced employees for demo
INSERT INTO users (id, email, password_hash, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440007', 'contractor1@external.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Alex Contractor', 'employee'),
('550e8400-e29b-41d4-a716-446655440008', 'freelancer@external.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Sarah Freelancer', 'employee')
ON CONFLICT (email) DO NOTHING;

-- Insert outsourced employees
INSERT INTO employees (id, user_id, employee_number, department, position, hire_date, category) VALUES
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'EXT001', 'Development', 'External Developer', '2024-01-01', 'outsourced'),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'EXT002', 'Design', 'Freelance Designer', '2024-02-01', 'outsourced')
ON CONFLICT (employee_number) DO NOTHING;

-- Add some attendance for outsourced employees (these won't appear in reports)
INSERT INTO attendance (employee_id, date, period, status, marked_by) VALUES
('660e8400-e29b-41d4-a716-446655440007', CURRENT_DATE, 'morning', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440007', CURRENT_DATE, 'afternoon', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440008', CURRENT_DATE, 'morning', 'absent', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440008', CURRENT_DATE, 'afternoon', 'present', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (employee_id, date, period) DO NOTHING;
