import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { OrderForm } from "../../order-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getOrder(id: number) {
  const result = await sql`
    SELECT * FROM service_orders WHERE id = ${id}
  `;
  return result[0];
}

async function getTechnicians() {
  return sql`
    SELECT 
      id,
      full_name,
      email
    FROM users
    WHERE role = 'technician' AND active = true
    ORDER BY full_name
  `;
}

export default async function EditarOrdenPage({ params }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/ordenes");
  }

  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    notFound();
  }

  const [order, technicians] = await Promise.all([
    getOrder(orderId),
    getTechnicians(),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/ordenes/${order.id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar Orden {order.order_number}
          </h1>
          <p className="text-muted-foreground">
            Modifica los datos de la orden de servicio
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Orden</CardTitle>
          <CardDescription>
            Actualice los datos del cliente y el servicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderForm technicians={technicians} order={order} />
        </CardContent>
      </Card>
    </div>
  );
}
