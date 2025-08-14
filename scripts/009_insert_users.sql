-- Insert demo users
INSERT INTO users (id, email, password_hash, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'HR Administrator', 'admin'),
('550e8400-e29b-41d4-a716-446655440001', 'employee@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'John Employee', 'employee'),
('550e8400-e29b-41d4-a716-446655440002', 'maria@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Maria Silva', 'employee'),
('550e8400-e29b-41d4-a716-446655440003', 'carlos@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Carlos Santos', 'employee'),
('550e8400-e29b-41d4-a716-446655440004', 'ana@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Ana Costa', 'employee'),
('550e8400-e29b-41d4-a716-446655440005', 'pedro@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Pedro Lima', 'employee'),
('550e8400-e29b-41d4-a716-446655440006', 'sofia@ceiromao.com', '$2b$10$rQZ8qNbJ1K1K2K3K4K5K6K7K8K9KaKbKcKdKeKfKgKhKiKjKkKlKm', 'Sofia Oliveira', 'employee')
ON CONFLICT (email) DO NOTHING;
