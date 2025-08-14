-- Insert sample activity logs
INSERT INTO activity_logs (user_id, action, table_name, record_id, new_values) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'SYSTEM_INIT', 'users', '550e8400-e29b-41d4-a716-446655440000', '{"message": "Database initialized with demo data"}'),
('550e8400-e29b-41d4-a716-446655440000', 'CREATE_ATTENDANCE', 'attendance', '770e8400-e29b-41d4-a716-446655440001', '{"status": "present", "employee": "John Employee"}'),
('550e8400-e29b-41d4-a716-446655440000', 'CREATE_ATTENDANCE', 'attendance', '770e8400-e29b-41d4-a716-446655440002', '{"status": "present", "employee": "Maria Silva"}'),
('550e8400-e29b-41d4-a716-446655440000', 'CREATE_ATTENDANCE', 'attendance', '770e8400-e29b-41d4-a716-446655440003', '{"status": "absent", "employee": "Carlos Santos"}'),
('550e8400-e29b-41d4-a716-446655440000', 'APPROVE_FILE', 'activity_files', '880e8400-e29b-41d4-a716-446655440001', '{"file_name": "activity-hours-january.pdf", "status": "approved"}'),
('550e8400-e29b-41d4-a716-446655440000', 'REJECT_FILE', 'activity_files', '880e8400-e29b-41d4-a716-446655440003', '{"file_name": "activity-summary.pdf", "status": "rejected"}');
