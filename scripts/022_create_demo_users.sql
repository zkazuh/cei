-- Create demo users with proper structure
INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@ceiromao.com', 'Administrator', '$2a$10$dummy.hash.for.demo.purposes.only', 'admin', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'employee@ceiromao.com', 'Employee User', '$2a$10$dummy.hash.for.demo.purposes.only', 'user', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'maria@ceiromao.com', 'Maria Silva', '$2a$10$dummy.hash.for.demo.purposes.only', 'user', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'carlos@ceiromao.com', 'Carlos Santos', '$2a$10$dummy.hash.for.demo.purposes.only', 'user', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'ana@ceiromao.com', 'Ana Costa', '$2a$10$dummy.hash.for.demo.purposes.only', 'user', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'pedro@ceiromao.com', 'Pedro Oliveira', '$2a$10$dummy.hash.for.demo.purposes.only', 'user', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'sofia@ceiromao.com', 'Sofia Rodrigues', '$2a$10$dummy.hash.for.demo.purposes.only', 'user', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
