import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClipboardList,
  Users,
  Wrench,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export const metadata = {
  title: "Panel Principal - Trakora",
};

async function getStats(userId: number, isAdmin: boolean) {
  const [ordersStats, toolsStats, materialsStats, techniciansCount] =
    await Promise.all([
      sql`
        SELECT 
          COUNT(*) FILTER (WHERE status IN ('new', 'assigned')) AS pendientes,
          COUNT(*) FILTER (WHERE status = 'in_progress') AS en_progreso,
          COUNT(*) FILTER (WHERE status = 'completed') AS completadas,
          COUNT(*) FILTER (
            WHERE priority = 'urgente'
              AND status IN ('new', 'assigned', 'in_progress')
          ) AS urgentes
        FROM service_orders
        ${isAdmin ? sql`` : sql`WHERE assigned_to = ${userId}`}
      `,

      isAdmin
        ? sql`
            SELECT 
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'available') AS disponibles,
              COUNT(*) FILTER (WHERE status = 'in_use') AS en_uso,
              COUNT(*) FILTER (WHERE status = 'maintenance') AS mantenimiento
            FROM tools
          `
        : Promise.resolve([
            {
              total: 0,
              disponibles: 0,
              en_uso: 0,
              mantenimiento: 0,
            },
          ]),

      isAdmin
        ? sql`
            SELECT
              COUNT(*) AS total,
              COUNT(*) FILTER (
                WHERE quantity_in_stock <= min_stock_level
              ) AS bajo_stock
            FROM materials
          `
        : Promise.resolve([
            {
              total: 0,
              bajo_stock: 0,
            },
          ]),

      isAdmin
        ? sql`
            SELECT COUNT(*) AS total
            FROM users
            WHERE role = 'technician' AND active = true
          `
        : Promise.resolve([{ total: 0 }]),
    ]);

  return {
    orders: ordersStats[0],
    tools: toolsStats[0],
    materials: materialsStats[0],
    technicians: techniciansCount[0],
  };
}

async function getRecentOrders(userId: number, isAdmin: boolean) {
  return sql`
    SELECT 
      so.id,
      so.order_number,
      so.client_name,
      so.description,
      so.status,
      so.priority,
      so.scheduled_date,
      u.full_name as technician_name
    FROM service_orders so
    LEFT JOIN users u ON so.assigned_to = u.id
    ${isAdmin ? sql`` : sql`WHERE so.assigned_to = ${userId}`}
    ORDER BY 
      CASE so.priority 
        WHEN 'urgente' THEN 1 
        WHEN 'alta' THEN 2 
        WHEN 'media' THEN 3 
        ELSE 4 
      END,
      so.created_at DESC
    LIMIT 5
  `;
}

const statusLabels: Record<string, string> = {
  new: "Nueva",
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
  new: "bg-amber-100 text-amber-800",
  assigned: "bg-sky-100 text-sky-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "admin";
  const stats = await getStats(session.user.id as number, isAdmin);
  const recentOrders = await getRecentOrders(
    session.user.id as number,
    isAdmin,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          Bienvenido, {session.user.full_name}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Resumen general del sistema"
            : "Resumen de tus órdenes asignadas"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Órdenes Activas
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.pendientes}</div>
            <p className="text-xs text-muted-foreground">Nuevas o asignadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.en_progreso}</div>
            <p className="text-xs text-muted-foreground">
              Órdenes en trabajo activo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.completadas}</div>
            <p className="text-xs text-muted-foreground">
              Servicios finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.orders.urgentes}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Técnicos Activos
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.technicians.total}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Herramientas
              </CardTitle>
              <Wrench className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tools.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.tools.en_uso} en uso, {stats.tools.mantenimiento} en
                mantenimiento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Materiales</CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.materials.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.materials.bajo_stock} con stock bajo
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
          <CardDescription>
            {isAdmin
              ? "Últimas órdenes creadas en el sistema"
              : "Tus últimas órdenes asignadas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay órdenes recientes
            </p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.order_number}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[order.priority]}`}
                      >
                        {priorityLabels[order.priority]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.client_name}
                    </p>
                    <p className="line-clamp-1 text-sm">{order.description}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                    {order.technician_name && (
                      <p className="text-xs text-muted-foreground">
                        {order.technician_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
