import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(process.env.DATABASE_URL);

// Types for database entities
export interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: "admin" | "tecnico";
  specialty: string | null;
  availability_status: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: Date;
}

export interface Tool {
  id: number;
  name: string;
  description: string | null;
  serial_number: string | null;
  status: "disponible" | "en_uso" | "mantenimiento" | "perdida";
  assigned_to: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Material {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  quantity_in_stock: number;
  min_stock_level: number;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceOrder {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string | null;
  client_address: string | null;
  description: string;
  status: "pendiente" | "en_progreso" | "completada" | "cancelada";
  priority: "baja" | "media" | "alta" | "urgente";
  assigned_to: number | null;
  scheduled_date: Date | null;
  completed_date: Date | null;
  notes: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderTool {
  id: number;
  order_id: number;
  tool_id: number;
  assigned_at: Date;
  returned_at: Date | null;
}

export interface OrderMaterial {
  id: number;
  order_id: number;
  material_id: number;
  quantity_used: number;
  assigned_at: Date;
}
