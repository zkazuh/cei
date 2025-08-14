-- Insert sample teacher employees
INSERT INTO employees (name, position, department, category, hire_date, status) VALUES
('Maria Santos', 'Mathematics Teacher', 'Education', 'teacher', '2023-01-15', 'active'),
('João Silva', 'Portuguese Teacher', 'Education', 'teacher', '2022-08-20', 'active'),
('Ana Costa', 'Science Teacher', 'Education', 'teacher', '2023-03-10', 'active'),
('Pedro Oliveira', 'History Teacher', 'Education', 'teacher', '2022-11-05', 'active'),
('Carla Ferreira', 'English Teacher', 'Education', 'teacher', '2023-02-28', 'active'),
('Miguel Rodrigues', 'Physical Education Teacher', 'Education', 'teacher', '2022-09-12', 'active'),
('Sofia Almeida', 'Art Teacher', 'Education', 'teacher', '2023-04-18', 'active'),
('Ricardo Pereira', 'Music Teacher', 'Education', 'teacher', '2022-10-30', 'active')
ON CONFLICT (name) DO NOTHING;

-- Create monthly file requirements for current month for all teachers
DO $$
DECLARE
    teacher_record RECORD;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
    due_date DATE := DATE(current_year || '-' || current_month || '-10');
BEGIN
    FOR teacher_record IN 
        SELECT id FROM employees WHERE category = 'teacher' AND status = 'active'
    LOOP
        INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status)
        VALUES (teacher_record.id, current_year, current_month, due_date, 'pending')
        ON CONFLICT (employee_id, year, month) DO NOTHING;
    END LOOP;
END $$;

-- Create some sample file requirements for previous months
DO $$
DECLARE
    teacher_record RECORD;
    prev_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month');
    prev_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month');
    prev_due_date DATE := DATE(prev_year || '-' || prev_month || '-10');
BEGIN
    FOR teacher_record IN 
        SELECT id FROM employees WHERE category = 'teacher' AND status = 'active' LIMIT 4
    LOOP
        INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status, submitted_at)
        VALUES (teacher_record.id, prev_year, prev_month, prev_due_date, 'submitted', CURRENT_TIMESTAMP - INTERVAL '5 days')
        ON CONFLICT (employee_id, year, month) DO NOTHING;
    END LOOP;
END $$;

-- Create some overdue requirements for demonstration
DO $$
DECLARE
    teacher_record RECORD;
    overdue_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months');
    overdue_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '2 months');
    overdue_due_date DATE := DATE(overdue_year || '-' || overdue_month || '-10');
BEGIN
    FOR teacher_record IN 
        SELECT id FROM employees WHERE category = 'teacher' AND status = 'active' LIMIT 2
    LOOP
        INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status)
        VALUES (teacher_record.id, overdue_year, overdue_month, overdue_due_date, 'overdue')
        ON CONFLICT (employee_id, year, month) DO NOTHING;
    END LOOP;
END $$;
