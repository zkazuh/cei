-- Insert employees
INSERT INTO employees (id, user_id, employee_number, department, position, hire_date) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'EMP001', 'Development', 'Software Developer', '2023-01-15'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'EMP002', 'Design', 'UI/UX Designer', '2023-02-01'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'EMP003', 'Development', 'Backend Developer', '2023-03-10'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'EMP004', 'Marketing', 'Marketing Specialist', '2023-04-01'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'EMP005', 'Development', 'Frontend Developer', '2023-05-15'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'EMP006', 'Design', 'Graphic Designer', '2023-06-01')
ON CONFLICT (employee_number) DO NOTHING;
