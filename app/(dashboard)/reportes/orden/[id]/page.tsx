import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { PrintButton } from "./print-button";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignada",
  in_progress: "En Progreso",
  completed: "Completada",
};

const priorityLabels: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

async function getOrder(id: number) {
  const result = await sql`
    SELECT 
      so.*,
      u.full_name as technician_name,
      creator.full_name as created_by_name
    FROM service_orders so
    LEFT JOIN users u ON so.assigned_to = u.id
    LEFT JOIN users creator ON so.created_by = creator.id
    WHERE so.id = ${id}
  `;
  return result[0];
}

async function getOrderTools(orderId: number) {
  return sql`
    SELECT 
      t.name,
      ot.created_at
    FROM order_tools ot
    JOIN tools t ON ot.tool_id = t.id
    WHERE ot.order_id = ${orderId}
    ORDER BY ot.created_at
  `;
}

async function getOrderMaterials(orderId: number) {
  return sql`
    SELECT 
      m.name,
      m.unit,
      om.quantity_used
    FROM order_materials om
    JOIN materials m ON om.material_id = m.id
    WHERE om.order_id = ${orderId}
    ORDER BY om.created_at
  `;
}

export default async function OrderReportPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    notFound();
  }

  const order = await getOrder(orderId);

  if (!order) {
    notFound();
  }

  const isAdmin = session.user.role === "admin";
  if (!isAdmin && order.assigned_to !== session.user.id) {
    redirect("/ordenes");
  }

  const [tools, materials] = await Promise.all([
    getOrderTools(orderId),
    getOrderMaterials(orderId),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-end mb-4 print:hidden">
        <PrintButton />
      </div>

      <div className="bg-background border rounded-lg p-8 print:border-0 print:p-0">
        {/* Header */}
        <div className="text-center border-b pb-6 mb-6">
          <h1 className="text-2xl font-bold">TRAKORA</h1>
          <p className="text-muted-foreground">
            Sistema de Gestión de Órdenes de Servicio
          </p>
          <p className="text-lg font-semibold mt-4">
            Orden de Servicio: {order.order_number}
          </p>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="font-semibold mb-2">Información del Cliente</h2>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Cliente:</span>{" "}
                {order.client_name}
              </p>
              {order.client_phone && (
                <p>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {order.client_phone}
                </p>
              )}
              {order.client_address && (
                <p>
                  <span className="font-medium">Dirección:</span>{" "}
                  {order.client_address}
                </p>
              )}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Detalles de la Orden</h2>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Estado:</span>{" "}
                {statusLabels[order.status]}
              </p>
              <p>
                <span className="font-medium">Prioridad:</span>{" "}
                {priorityLabels[order.priority]}
              </p>
              <p>
                <span className="font-medium">Técnico:</span>{" "}
                {order.technician_name || "Sin asignar"}
              </p>
              {order.scheduled_date && (
                <p>
                  <span className="font-medium">Fecha Programada:</span>{" "}
                  {new Date(order.scheduled_date).toLocaleDateString("es-DO")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Descripción del Servicio</h2>
          <p className="text-sm whitespace-pre-wrap border rounded p-3 bg-muted/30">
            {order.description}
          </p>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Notas</h2>
            <p className="text-sm whitespace-pre-wrap border rounded p-3 bg-muted/30">
              {order.notes}
            </p>
          </div>
        )}

        {/* Tools */}
        {tools.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Herramientas Utilizadas</h2>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 border">Herramienta</th>
                  <th className="text-left p-2 border">Número de Serie</th>
                  <th className="text-left p-2 border">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool, i) => (
                  <tr key={i}>
                    <td className="p-2 border">{tool.name}</td>
                    <td className="p-2 border">{tool.serial_number || "-"}</td>
                    <td className="p-2 border">
                      {tool.returned_at ? "Devuelta" : "En uso"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Materials */}
        {materials.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Materiales Utilizados</h2>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 border">Material</th>
                  <th className="text-left p-2 border">Cantidad</th>
                  <th className="text-left p-2 border">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material, i) => (
                  <tr key={i}>
                    <td className="p-2 border">{material.name}</td>
                    <td className="p-2 border">{material.quantity_used}</td>
                    <td className="p-2 border">{material.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-6 mt-6">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p>
                <span className="font-medium">Creado por:</span>{" "}
                {order.created_by_name}
              </p>
              <p>
                <span className="font-medium">Fecha de Creación:</span>{" "}
                {new Date(order.created_at).toLocaleDateString("es-DO")}
              </p>
            </div>
            {order.completed_date && (
              <div>
                <p>
                  <span className="font-medium">Fecha de Finalización:</span>{" "}
                  {new Date(order.completed_date).toLocaleDateString("es-DO")}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-foreground w-48 mx-auto pt-2">
                <p className="text-sm font-medium">Firma del Técnico</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground w-48 mx-auto pt-2">
                <p className="text-sm font-medium">Firma del Cliente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    return {
      title: "Orden - Horse Power SRL",
    };
  }

  const result = await sql`
    SELECT order_number
    FROM service_orders
    WHERE id = ${orderId}
  `;

  const order = result[0];

  return {
    title: order
      ? `Horse Power SRL - Orden ${order.order_number}`
      : "Orden - Horse Power SRL",
  };
}
