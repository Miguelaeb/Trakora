import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Phone,
  MapPin,
  Calendar,
  User,
  Printer,
} from "lucide-react";
import { OrderToolsSection } from "./order-tools-section";
import { OrderMaterialsSection } from "./order-materials-section";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

const priorityColors: Record<string, string> = {
  baja: "bg-muted text-muted-foreground",
  media: "bg-blue-100 text-blue-800",
  alta: "bg-amber-100 text-amber-800",
  urgente: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  assigned: "bg-sky-100 text-sky-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

async function getOrder(id: number) {
  const result = await sql`
    SELECT 
      so.*,
      u.full_name as technician_name,
      u.email as technician_email,
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
      ot.id as order_tool_id,
      ot.created_at,
      ot.returned_at,
      ot.return_status,
      ot.return_requested_at,
      ot.return_requested_by,
      ot.return_approved_at,
      ot.return_approved_by,
      ot.return_rejected_at,
      ot.return_rejected_by,
      t.id as tool_id,
      t.name,
      t.status
    FROM order_tools ot
    JOIN tools t ON ot.tool_id = t.id
    WHERE ot.order_id = ${orderId}
    ORDER BY ot.created_at DESC
  `;
}

async function getToolRequests(orderId: number) {
  return sql`
    SELECT
      tr.id,
      tr.order_id,
      tr.tool_id,
      t.name AS tool_name,
      tr.requested_by,
      u.full_name AS requested_by_name,
      tr.status,
      tr.rejection_reason,
      tr.reviewed_by,
      tr.reviewed_at,
      tr.created_at
    FROM tool_requests tr
    JOIN tools t ON t.id = tr.tool_id
    JOIN users u ON u.id = tr.requested_by
    WHERE tr.order_id = ${orderId}
    ORDER BY tr.created_at DESC
  `;
}

async function getOrderMaterials(orderId: number) {
  return sql`
    SELECT 
      om.id as order_material_id,
      om.quantity_used,
      om.created_at,
      m.id as material_id,
      m.name,
      m.unit
    FROM order_materials om
    JOIN materials m ON om.material_id = m.id
    WHERE om.order_id = ${orderId}
    ORDER BY om.created_at DESC
  `;
}

async function getAvailableTools() {
  return sql`
    SELECT id, name
    FROM tools
    WHERE status = 'available'
    ORDER BY name
  `;
}

async function getAvailableMaterials() {
  return sql`
    SELECT id, name, unit, quantity_in_stock
    FROM materials
    WHERE quantity_in_stock > 0
    ORDER BY name
  `;
}

export default async function OrderDetailPage({ params }: PageProps) {
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

  const [
    orderTools,
    orderMaterials,
    availableTools,
    availableMaterials,
    toolRequests,
  ] = await Promise.all([
    getOrderTools(orderId),
    getOrderMaterials(orderId),
    getAvailableTools(),
    getAvailableMaterials(),
    getToolRequests(orderId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/ordenes">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {order.order_number}
              </h1>
              <Badge className={`${statusColors[order.status]} border-0`}>
                {statusLabels[order.status]}
              </Badge>
              <Badge className={`${priorityColors[order.priority]} border-0`}>
                {priorityLabels[order.priority]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{order.client_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/reportes/orden/${order.id}`}>
              <Printer className="mr-2 size-4" />
              Imprimir
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild>
              <Link href={`/ordenes/${order.id}/editar`}>
                <Edit className="mr-2 size-4" />
                Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información del Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                Descripción
              </h4>
              <p className="whitespace-pre-wrap">{order.description}</p>
            </div>

            {order.notes && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                  Notas
                </h4>
                <p className="whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              {order.client_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{order.client_phone}</span>
                </div>
              )}
              {order.client_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{order.client_address}</span>
                </div>
              )}
              {order.scheduled_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>
                    Programada:{" "}
                    {new Date(order.scheduled_date).toLocaleDateString("es-DO")}
                  </span>
                </div>
              )}
              {order.technician_name && (
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span>Técnico: {order.technician_name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Creado por</p>
              <p className="font-medium">{order.created_by_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleDateString("es-DO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {order.completed_date && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Fecha de Finalización
                </p>
                <p className="font-medium">
                  {new Date(order.completed_date).toLocaleDateString("es-DO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">
                Última Actualización
              </p>
              <p className="font-medium">
                {new Date(order.updated_at).toLocaleDateString("es-DO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <OrderToolsSection
        orderId={orderId}
        orderTools={orderTools}
        availableTools={availableTools}
        toolRequests={toolRequests}
        canEdit={!["completed", "cancelled"].includes(order.status)}
        isAdmin={isAdmin}
      />

      <OrderMaterialsSection
        orderId={orderId}
        orderMaterials={orderMaterials}
        availableMaterials={availableMaterials}
        canEdit={!["completed", "cancelled"].includes(order.status)}
      />
    </div>
  );
}
