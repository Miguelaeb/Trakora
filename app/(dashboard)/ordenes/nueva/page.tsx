import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
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
import { OrderForm } from "../order-form";

export const metadata = {
  title: "Nueva Orden - Trakora",
};

async function getTechnicians() {
  return sql`
    SELECT id, full_name, email 
    FROM users 
    WHERE role = 'technician' AND active = true
    ORDER BY full_name
  `;
}

export default async function NuevaOrdenPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/ordenes");
  }

  const technicians = await getTechnicians();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ordenes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Nueva Orden de Servicio
          </h1>
          <p className="text-muted-foreground">
            Crea una nueva orden para un cliente
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Orden</CardTitle>
          <CardDescription>
            Complete los datos del cliente y el servicio requerido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderForm technicians={technicians} />
        </CardContent>
      </Card>
    </div>
  );
}
