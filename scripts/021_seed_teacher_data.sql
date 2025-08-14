-- Add some teachers for demo
INSERT INTO users (id, email, password_hash, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440009', 'teacher1@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Prof. Maria Santos', 'employee'),
('550e8400-e29b-41d4-a716-446655440010', 'teacher2@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Prof. João Silva', 'employee'),
('550e8400-e29b-41d4-a716-446655440011', 'teacher3@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Prof. Ana Costa', 'employee')
ON CONFLICT (email) DO NOTHING;

-- Insert teacher employees
INSERT INTO employees (id, user_id, employee_number, department, position, hire_date, category) VALUES
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', 'TCH001', 'Education', 'Mathematics Teacher', '2023-01-15', 'teacher'),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', 'TCH002', 'Education', 'Science Teacher', '2023-02-01', 'teacher'),
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', 'TCH003', 'Education', 'Language Teacher', '2023-03-01', 'teacher')
ON CONFLICT (employee_number) DO NOTHING;

-- Create monthly file requirements for current year
DO $$
DECLARE
    teacher_id UUID;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    month_num INTEGER;
BEGIN
    -- For each teacher
    FOR teacher_id IN 
        SELECT id FROM employees WHERE category = 'teacher' AND is_active = true
    LOOP
        -- Create requirements for each month of current year
        FOR month_num IN 1..12 LOOP
            INSERT INTO monthly_file_requirements (employee_id, year, month, due_date, status)
            VALUES (
                teacher_id,
                current_year,
                month_num,
                DATE(current_year || '-' || LPAD(month_num::text, 2, '0') || '-10'),
                CASE 
                    WHEN DATE(current_year || '-' || LPAD(month_num::text, 2, '0') || '-10') < CURRENT_DATE THEN 'overdue'
                    ELSE 'pending'
                END
            )
            ON CONFLICT (employee_id, year, month) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Submit some files for demo (mark some as submitted)
UPDATE monthly_file_requirements 
SET status = 'submitted' 
WHERE employee_id IN (
    SELECT id FROM employees WHERE employee_number IN ('TCH001', 'TCH002')
) AND month IN (1, 2, 3);
