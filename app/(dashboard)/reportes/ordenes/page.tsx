import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import { PrintButton } from "../orden/[id]/print-button";

export const metadata = {
  title: "Reporte de Órdenes - Trakora",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignada",
  in_progress: "En Progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};

const priorityLabels: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

async function getOrders() {
  return sql`
    SELECT 
      so.order_number,
      so.client_name,
      so.description,
      so.status,
      so.priority,
      so.scheduled_date,
      so.created_at,
      so.completed_date,
      u.full_name as technician_name
    FROM service_orders so
    LEFT JOIN users u ON so.assigned_to = u.id
    ORDER BY so.created_at DESC
    LIMIT 200
  `;
}

export default async function ReporteOrdenesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const orders = await getOrders();
  const now = new Date().toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="rounded-lg border bg-background p-8 print:border-0 print:p-0">
        <div className="mb-6 border-b pb-6 text-center">
          <h1 className="text-2xl font-bold">TRAKORA</h1>
          <p className="text-muted-foreground">
            Reporte de Órdenes de Servicio
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Generado el {now}
          </p>
        </div>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="border p-2 text-left">Orden</th>
              <th className="border p-2 text-left">Cliente</th>
              <th className="border p-2 text-left">Estado</th>
              <th className="border p-2 text-left">Prioridad</th>
              <th className="border p-2 text-left">Técnico</th>
              <th className="border p-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={i}>
                <td className="border p-2 font-medium">{order.order_number}</td>
                <td className="border p-2">{order.client_name}</td>
                <td className="border p-2">
                  {statusLabels[order.status] || order.status}
                </td>
                <td className="border p-2">
                  {priorityLabels[order.priority] || order.priority}
                </td>
                <td className="border p-2">{order.technician_name || "-"}</td>
                <td className="border p-2">
                  {new Date(order.created_at).toLocaleDateString("es-DO")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-4 text-sm text-muted-foreground">
          Total: {orders.length} órdenes
        </p>
      </div>
    </div>
  );
}
