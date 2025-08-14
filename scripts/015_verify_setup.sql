-- Verify the database setup
SELECT 'Database Setup Verification' as status;

-- Check all tables exist and have data
SELECT 'users' as table_name, COUNT(*) as record_count FROM users;
SELECT 'employees' as table_name, COUNT(*) as record_count FROM employees;
SELECT 'attendance' as table_name, COUNT(*) as record_count FROM attendance;
SELECT 'attendance_justifications' as table_name, COUNT(*) as record_count FROM attendance_justifications;
SELECT 'activity_files' as table_name, COUNT(*) as record_count FROM activity_files;
SELECT 'activity_logs' as table_name, COUNT(*) as record_count FROM activity_logs;

-- Check today's attendance statistics
SELECT 
  'Today Attendance Stats' as info,
  COUNT(*) as total_marked,
  COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count
FROM attendance 
WHERE date = CURRENT_DATE;

-- Check file status distribution
SELECT 
  'File Status Distribution' as info,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_files,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_files,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_files
FROM activity_files;

-- Show user-employee relationships
SELECT 
  u.name as user_name,
  u.role,
  e.employee_number,
  e.department,
  e.position
FROM users u
LEFT JOIN employees e ON u.id = e.user_id
ORDER BY u.role DESC, u.name;

SELECT 'Database setup completed successfully!' as final_status;
