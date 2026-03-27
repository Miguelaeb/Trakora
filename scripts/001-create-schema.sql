-- Trakora Database Schema
-- Sistema de gestión de órdenes de servicio

-- Tabla de usuarios (admin y técnicos)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
  specialty VARCHAR(100),
  availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'off')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sesiones para autenticación
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de herramientas
CREATE TABLE IF NOT EXISTS tools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  internal_code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN ('available', 'in_use', 'maintenance')),
  assigned_technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de materiales
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50) NOT NULL,
  stock_quantity DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de órdenes de servicio
CREATE TABLE IF NOT EXISTS service_orders (
  id SERIAL PRIMARY KEY,
  service_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Datos del cliente
  client_name VARCHAR(255) NOT NULL,
  client_address TEXT NOT NULL,
  client_phone VARCHAR(50),
  client_email VARCHAR(255),
  
  -- Datos del servicio
  service_date DATE NOT NULL,
  service_time TIME,
  service_location TEXT,
  service_type VARCHAR(100) NOT NULL,
  
  -- Técnico asignado
  assigned_technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Detalles del trabajo
  equipment_serviced TEXT,
  diagnosis TEXT,
  action_performed TEXT,
  time_spent_minutes INTEGER,
  observations TEXT,
  
  -- Firmas (guardadas como data URLs o rutas de imagen)
  technician_signature TEXT,
  client_signature TEXT,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación órdenes-herramientas
CREATE TABLE IF NOT EXISTS order_tools (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, tool_id)
);

-- Tabla de relación órdenes-materiales
CREATE TABLE IF NOT EXISTS order_materials (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity_used DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_technician ON service_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_date ON service_orders(service_date);
CREATE INDEX IF NOT EXISTS idx_tools_availability ON tools(availability);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Insertar usuario admin por defecto (contraseña: admin123)
-- Hash generado con bcrypt cost 10
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@trakora.com', '$2b$10$rQZ5QzPkP8W8W8W8W8W8WOxGqXqXqXqXqXqXqXqXqXqXqXqXqXqXq', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;
