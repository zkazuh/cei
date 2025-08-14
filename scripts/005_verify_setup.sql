-- Verify the database setup with comprehensive checks
SELECT 'Database Setup Verification' as status;

-- Check users table
SELECT 'Users Table' as table_name, COUNT(*) as record_count FROM users;
SELECT 'Admin Users' as user_type, COUNT(*) as count FROM users WHERE role = 'admin';
SELECT 'Employee Users' as user_type, COUNT(*) as count FROM users WHERE role = 'employee';

-- Check employees table
SELECT 'Employees Table' as table_name, COUNT(*) as record_count FROM employees;
SELECT 'Active Employees' as employee_status, COUNT(*) as count FROM employees WHERE is_active = true;

-- Check attendance table
SELECT 'Attendance Table' as table_name, COUNT(*) as record_count FROM attendance;
SELECT 'Today Attendance' as attendance_period, COUNT(*) as count FROM attendance WHERE date = CURRENT_DATE;
SELECT 'Present Today' as status, COUNT(*) as count FROM attendance WHERE date = CURRENT_DATE AND status = 'present';
SELECT 'Absent Today' as status, COUNT(*) as count FROM attendance WHERE date = CURRENT_DATE AND status = 'absent';

-- Check attendance justifications
SELECT 'Justifications Table' as table_name, COUNT(*) as record_count FROM attendance_justifications;

-- Check activity files
SELECT 'Activity Files Table' as table_name, COUNT(*) as record_count FROM activity_files;
SELECT 'Pending Files' as file_status, COUNT(*) as count FROM activity_files WHERE status = 'pending';
SELECT 'Approved Files' as file_status, COUNT(*) as count FROM activity_files WHERE status = 'approved';
SELECT 'Rejected Files' as file_status, COUNT(*) as count FROM activity_files WHERE status = 'rejected';

-- Check activity logs
SELECT 'Activity Logs Table' as table_name, COUNT(*) as record_count FROM activity_logs;

-- Check relationships and data integrity
SELECT 'Data Integrity Check' as check_type;
SELECT 
  u.name as user_name,
  u.role,
  e.employee_number,
  e.department,
  e.position,
  CASE WHEN a.status IS NOT NULL THEN a.status ELSE 'Not Marked' END as today_status
FROM users u
LEFT JOIN employees e ON u.id = e.user_id
LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = CURRENT_DATE
WHERE u.role = 'employee'
ORDER BY u.name;

-- Show recent activity
SELECT 'Recent Activity Logs' as log_type;
SELECT 
  al.action,
  al.table_name,
  u.name as user_name,
  al.created_at
FROM activity_logs al
JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 10;

SELECT 'Database setup completed successfully!' as final_status;
