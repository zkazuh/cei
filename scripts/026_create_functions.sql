-- Function to create monthly requirements for teachers
CREATE OR REPLACE FUNCTION create_monthly_requirements_for_teachers(
    target_year INTEGER,
    target_month INTEGER
) RETURNS INTEGER AS $$
DECLARE
    created_count INTEGER := 0;
    teacher_record RECORD;
    due_date_calc DATE;
BEGIN
    -- Calculate due date (10th of the target month)
    due_date_calc := DATE(target_year || '-' || target_month || '-10');
    
    -- Loop through all active teachers
    FOR teacher_record IN 
        SELECT id FROM employees 
        WHERE category = 'teacher' AND status = 'active'
    LOOP
        -- Insert requirement if it doesn't exist
        INSERT INTO monthly_file_requirements (
            employee_id, 
            year, 
            month, 
            due_date, 
            status
        ) VALUES (
            teacher_record.id,
            target_year,
            target_month,
            due_date_calc,
            'pending'
        ) ON CONFLICT (employee_id, year, month) DO NOTHING;
        
        -- Check if a row was actually inserted
        IF FOUND THEN
            created_count := created_count + 1;
        END IF;
    END LOOP;
    
    RETURN created_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update overdue requirements
CREATE OR REPLACE FUNCTION update_overdue_requirements() RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE monthly_file_requirements 
    SET status = 'overdue'
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
