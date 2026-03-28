import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
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
      u.full_name as technician_name,

      (
        SELECT COUNT(*)
        FROM tool_requests tr
        WHERE tr.order_id = so.id
          AND tr.status = 'pending'
      ) AS pending_tool_requests,

      (
        SELECT COUNT(*)
        FROM material_requests mr
        WHERE mr.order_id = so.id
          AND mr.status = 'pending'
      ) AS pending_material_requests,

      (
        SELECT COUNT(*)
        FROM order_tools ot
        WHERE ot.order_id = so.id
          AND ot.return_status = 'pending_approval'
          AND ot.returned_at IS NULL
      ) AS pending_tool_returns

    FROM service_orders so
    LEFT JOIN users u ON so.assigned_to = u.id
    ${isAdmin ? sql`` : sql`WHERE so.assigned_to = ${userId}`}

    ORDER BY 
      CASE so.status
        WHEN 'pending' THEN 1
        WHEN 'assigned' THEN 2
        WHEN 'in_progress' THEN 3
        WHEN 'completed' THEN 4
        WHEN 'cancelled' THEN 5
        ELSE 6
      END,
      CASE so.priority 
        WHEN 'urgente' THEN 1 
        WHEN 'alta' THEN 2 
        WHEN 'media' THEN 3 
        WHEN 'baja' THEN 4
        ELSE 5 
      END,
      so.created_at DESC
  `;
}

export default async function OrdenesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "admin";
  const orders = await getOrders(session.user.id as number, isAdmin);

  const ordersWithPending = orders.filter((order: any) => {
    const pendingTools = Number(order.pending_tool_requests || 0);
    const pendingMaterials = Number(order.pending_material_requests || 0);
    const pendingReturns = Number(order.pending_tool_returns || 0);

    return pendingTools + pendingMaterials + pendingReturns > 0;
  });

  const totalPendingRequests = orders.reduce((acc: number, order: any) => {
    return (
      acc +
      Number(order.pending_tool_requests || 0) +
      Number(order.pending_material_requests || 0) +
      Number(order.pending_tool_returns || 0)
    );
  }, 0);

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

      {isAdmin && ordersWithPending.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-amber-700" />
            <div>
              <p className="font-medium text-amber-900">
                Hay {ordersWithPending.length}{" "}
                {ordersWithPending.length === 1
                  ? "orden con pendientes"
                  : "órdenes con pendientes"}
              </p>
              <p className="text-sm text-amber-800">
                Actualmente tienes {totalPendingRequests}{" "}
                {totalPendingRequests === 1
                  ? "pendiente por revisar"
                  : "pendientes por revisar"}{" "}
                entre solicitudes de materiales, herramientas y devoluciones.
              </p>
            </div>
          </div>
        </div>
      )}

      <OrdersTable orders={orders} isAdmin={isAdmin} />
    </div>
  );
}
