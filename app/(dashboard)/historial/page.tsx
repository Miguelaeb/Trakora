import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export const metadata = {
  title: "Historial - Trakora",
};

const statusLabels: Record<string, string> = {
  completed: "Completada",
  cancelled: "Cancelada",
};

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

async function getCompletedOrders(userId: number, isAdmin: boolean) {
  return sql`
    SELECT 
      so.id,
      so.order_number,
      so.client_name,
      so.description,
      so.status,
      so.completed_date,
      so.created_at,
      u.full_name as technician_name
    FROM service_orders so
    LEFT JOIN users u ON so.assigned_to = u.id
    WHERE so.status IN ('completed', 'cancelled')
      ${isAdmin ? sql`` : sql`AND so.assigned_to = ${userId}`}
    ORDER BY COALESCE(so.completed_date, so.updated_at) DESC
    LIMIT 100
  `;
}

export default async function HistorialPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "admin";
  const orders = await getCompletedOrders(session.user.id as number, isAdmin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Historial de Órdenes
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Órdenes completadas y canceladas del sistema"
            : "Tu historial de órdenes"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes Finalizadas</CardTitle>
          <CardDescription>
            Últimas 100 órdenes completadas o canceladas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay órdenes en el historial
            </p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.order_number}</span>
                      <Badge
                        className={`${statusColors[order.status] || "bg-muted text-muted-foreground"} border-0`}
                      >
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium">{order.client_name}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {order.description || "Sin descripción"}
                    </p>

                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {order.technician_name && (
                        <span>Técnico: {order.technician_name}</span>
                      )}

                      {order.completed_date && (
                        <span>
                          Finalizada:{" "}
                          {new Date(order.completed_date).toLocaleDateString(
                            "es-DO",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/ordenes/${order.id}`}>
                      <Eye className="mr-2 size-4" />
                      Ver
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
