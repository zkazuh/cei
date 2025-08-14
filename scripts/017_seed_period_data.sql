-- Update existing attendance records to have morning period
UPDATE attendance SET period = 'morning' WHERE period IS NULL;

-- Insert some afternoon attendance records for demo
INSERT INTO attendance (employee_id, date, period, status, marked_by) VALUES
-- Today's afternoon attendance
('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 'afternoon', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'afternoon', 'absent', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 'afternoon', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, 'afternoon', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440005', CURRENT_DATE, 'afternoon', 'present', '550e8400-e29b-41d4-a716-446655440000'),
('660e8400-e29b-41d4-a716-446655440006', CURRENT_DATE, 'afternoon', 'absent', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (employee_id, date, period) DO NOTHING;

-- Add some justifications for the new afternoon absences
INSERT INTO attendance_justifications (attendance_id, justification_type, justification_text, created_by)
SELECT 
  a.id,
  'course',
  'Attending training course',
  '550e8400-e29b-41d4-a716-446655440000'
FROM attendance a
JOIN employees e ON a.employee_id = e.id
JOIN users u ON e.user_id = u.id
WHERE a.status = 'absent' AND a.period = 'afternoon' AND u.name = 'Maria Silva' AND a.date = CURRENT_DATE;

INSERT INTO attendance_justifications (attendance_id, justification_type, justification_text, created_by)
SELECT 
  a.id,
  'meeting',
  'Client meeting',
  '550e8400-e29b-41d4-a716-446655440000'
FROM attendance a
JOIN employees e ON a.employee_id = e.id
JOIN users u ON e.user_id = u.id
WHERE a.status = 'absent' AND a.period = 'afternoon' AND u.name = 'Sofia Oliveira' AND a.date = CURRENT_DATE;
