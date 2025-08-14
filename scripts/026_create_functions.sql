-- Function to create monthly requirements for all teachers
CREATE OR REPLACE FUNCTION create_monthly_requirements_for_teachers(
    target_year INTEGER,
    target_month INTEGER
) RETURNS INTEGER AS $$
DECLARE
    teacher_count INTEGER := 0;
    due_date_calc DATE;
BEGIN
    -- Calculate due date (10th of the target month)
    due_date_calc := DATE(target_year || '-' || LPAD(target_month::TEXT, 2, '0') || '-10');
    
    -- Insert requirements for all active teachers
    INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status)
    SELECT 
        e.id,
        target_year,
        target_month,
        due_date_calc,
        'pending'
    FROM employees e
    WHERE e.category = 'teacher' 
      AND e.status = 'active'
      AND NOT EXISTS (
          SELECT 1 FROM monthly_file_requirements mfr
          WHERE mfr.employee_id = e.id 
            AND mfr.year = target_year 
            AND mfr.month = target_month
      );
    
    GET DIAGNOSTICS teacher_count = ROW_COUNT;
    RETURN teacher_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update overdue requirements
CREATE OR REPLACE FUNCTION update_overdue_requirements() RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE monthly_file_requirements 
    SET status = 'overdue'
    WHERE status = 'pending' 
      AND due_date < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
