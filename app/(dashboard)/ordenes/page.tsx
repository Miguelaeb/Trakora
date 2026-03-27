import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OrdersTable } from "./orders-table";

export const metadata = {
  title: "Órdenes de Servicio - Trakora",
};

async function getOrders(userId: number, isAdmin: boolean) {
  return sql`
    SELECT 
      so.id,
      so.order_number,
      so.client_name,
      so.client_phone,
      so.client_address,
      so.description,
      so.status,
      so.priority,
      so.scheduled_date,
      so.created_at,
      u.full_name as technician_name
    FROM service_orders so
    LEFT JOIN users u ON so.assigned_to = u.id
    ${isAdmin ? sql`` : sql`WHERE so.assigned_to = ${userId}`}
    ORDER BY 
      CASE so.status
        WHEN 'pendiente' THEN 1
        WHEN 'en_progreso' THEN 2
        WHEN 'completada' THEN 3
        ELSE 4
      END,
      CASE so.priority 
        WHEN 'urgente' THEN 1 
        WHEN 'alta' THEN 2 
        WHEN 'media' THEN 3 
        ELSE 4 
      END,
      so.created_at DESC
  `;
}

export default async function OrdenesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "admin";
  const orders = await getOrders(session.user.id as number, isAdmin);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Órdenes de Servicio
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Gestiona todas las órdenes del sistema"
              : "Tus órdenes asignadas"}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/ordenes/nueva">
              <Plus className="mr-2 size-4" />
              Nueva Orden
            </Link>
          </Button>
        )}
      </div>

      <OrdersTable orders={orders} isAdmin={isAdmin} />
    </div>
  );
}
