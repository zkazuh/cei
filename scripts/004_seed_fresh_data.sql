-- Insert demo users with proper UUIDs
INSERT INTO users (id, email, password_hash, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'HR Administrator', 'admin'),
('550e8400-e29b-41d4-a716-446655440001', 'employee@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'John Employee', 'employee'),
('550e8400-e29b-41d4-a716-446655440002', 'maria@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Maria Silva', 'employee'),
('550e8400-e29b-41d4-a716-446655440003', 'carlos@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Carlos Santos', 'employee'),
('550e8400-e29b-41d4-a716-446655440004', 'ana@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Ana Costa', 'employee'),
('550e8400-e29b-41d4-a716-446655440005', 'pedro@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Pedro Lima', 'employee'),
('550e8400-e29b-41d4-a716-446655440006', 'sofia@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Sofia Oliveira', 'employee');

-- Insert employees with proper relationships
INSERT INTO employees (id, user_id, employee_number, department, position, hire_date) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'EMP001', 'Development', 'Software Developer', '2023-01-15'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'EMP002', 'Design', 'UI/UX Designer', '2023-02-01'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'EMP003', 'Development', 'Backend Developer', '2023-03-10'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'EMP004', 'Marketing', 'Marketing Specialist', '2023-04-01'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'EMP005', 'Development', 'Frontend Developer', '2023-05-15'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'EMP006', 'Design', 'Graphic Designer', '2023-06-01');

-- Insert today's attendance records
INSERT INTO attendance (id, employee_id, date, status, marked_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440000'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440000'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 'absent', '550e8400-e29b-41d4-a716-446655440000'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440000'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', CURRENT_DATE, 'absent', '550e8400-e29b-41d4-a716-446655440000'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', CURRENT_DATE, 'present', '550e8400-e29b-41d4-a716-446655440000');

-- Insert justifications for absent employees
INSERT INTO attendance_justifications (attendance_id, justification_type, justification_text, created_by) VALUES
('770e8400-e29b-41d4-a716-446655440003', 'medical', 'Medical appointment - routine checkup', '550e8400-e29b-41d4-a716-446655440000'),
('770e8400-e29b-41d4-a716-446655440005', 'justified', 'Family emergency - approved by supervisor', '550e8400-e29b-41d4-a716-446655440000');

-- Insert sample activity files
INSERT INTO activity_files (id, employee_id, file_name, file_path, file_size, file_type, status, reviewed_by, reviewed_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'activity-hours-january.pdf', 'activity-files/660e8400-e29b-41d4-a716-446655440001/activity-hours-january.pdf', 2457600, 'application/pdf', 'approved', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '2 days'),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'monthly-report-february.docx', 'activity-files/660e8400-e29b-41d4-a716-446655440002/monthly-report-february.docx', 1887436, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'pending', NULL, NULL),
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'activity-summary.pdf', 'activity-files/660e8400-e29b-41d4-a716-446655440003/activity-summary.pdf', 3251200, 'application/pdf', 'rejected', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '1 day'),
('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'project-documentation.pdf', 'activity-files/660e8400-e29b-41d4-a716-446655440004/project-documentation.pdf', 4194304, 'application/pdf', 'pending', NULL, NULL),
('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 'development-log.docx', 'activity-files/660e8400-e29b-41d4-a716-446655440005/development-log.docx', 1572864, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'approved', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '3 hours');

-- Insert sample activity logs for audit trail
INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'SYSTEM_INIT', 'users', '550e8400-e29b-41d4-a716-446655440000', '{"message": "Database initialized with demo data", "timestamp": "' || NOW() || '"}'),
('550e8400-e29b-41d4-a716-446655440000', 'CREATE_ATTENDANCE', 'attendance', '770e8400-e29b-41d4-a716-446655440001', '{"date": "' || CURRENT_DATE || '", "status": "present", "employee": "John Employee"}'),
('550e8400-e29b-41d4-a716-446655440000', 'CREATE_ATTENDANCE', 'attendance', '770e8400-e29b-41d4-a716-446655440002', '{"date": "' || CURRENT_DATE || '", "status": "present", "employee": "Maria Silva"}'),
('550e8400-e29b-41d4-a716-446655440000', 'CREATE_ATTENDANCE', 'attendance', '770e8400-e29b-41d4-a716-446655440003', '{"date": "' || CURRENT_DATE || '", "status": "absent", "employee": "Carlos Santos"}'),
('550e8400-e29b-41d4-a716-446655440000', 'APPROVE_FILE', 'activity_files', '880e8400-e29b-41d4-a716-446655440001', '{"file_name": "activity-hours-january.pdf", "status": "approved"}'),
('550e8400-e29b-41d4-a716-446655440000', 'REJECT_FILE', 'activity_files', '880e8400-e29b-41d4-a716-446655440003', '{"file_name": "activity-summary.pdf", "status": "rejected", "reason": "Incomplete documentation"}');

-- Insert some historical attendance data for better statistics
INSERT INTO attendance (employee_id, date, status, marked_by) VALUES
-- Yesterday's data
('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 day', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '1 day', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '1 day', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440004', CURRENT_DATE - INTERVAL '1 day', 'absent', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '1 day', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440006', CURRENT_DATE - INTERVAL '1 day', 'present', '550e8400-e29b-41d4-a716-446655440000'),
-- Day before yesterday
('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '2 days', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '2 days', 'absent', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440003', CURRENT_DATE - INTERVAL '2 days', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440004', CURRENT_DATE - INTERVAL '2 days', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440005', CURRENT_DATE - INTERVAL '2 days', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440006', CURRENT_DATE - INTERVAL '2 days', 'present', '550e8400-e29b-41d4-a716-446655440000');
