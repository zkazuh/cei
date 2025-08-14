-- Fix employees table structure
ALTER TABLE employees DROP COLUMN IF EXISTS status;
ALTER TABLE employees DROP COLUMN IF EXISTS category;

-- Add the correct columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('regular', 'outsourced', 'teacher')) DEFAULT 'regular';

-- Update existing employees to have proper status and category
UPDATE employees SET status = 'active' WHERE status IS NULL;
UPDATE employees SET category = 'regular' WHERE category IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_category ON employees(category);

-- Update some employees to be teachers for demo
UPDATE employees SET category = 'teacher' WHERE name IN ('Maria Silva', 'Carlos Santos', 'Ana Costa');
