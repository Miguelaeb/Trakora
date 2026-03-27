import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TechniciansTable } from "./technicians-table";

export const metadata = {
  title: "Técnicos - Trakora",
};

async function getTechnicians() {
  return sql`
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.specialty,
      u.active,
      u.created_at,
      COUNT(so.id) FILTER (
        WHERE so.status IN ('pending', 'assigned', 'in_progress')
      ) as active_orders
    FROM users u
    LEFT JOIN service_orders so ON u.id = so.assigned_to
    WHERE u.role = 'technician'
    GROUP BY 
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.specialty,
      u.active,
      u.created_at
    ORDER BY u.full_name
  `;
}

export default async function TecnicosPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const technicians = await getTechnicians();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Técnicos</h1>
          <p className="text-muted-foreground">
            Gestiona los técnicos del sistema
          </p>
        </div>

        <Button asChild>
          <Link href="/tecnicos/nuevo">
            <Plus className="mr-2 size-4" />
            Nuevo Técnico
          </Link>
        </Button>
      </div>

      <TechniciansTable technicians={technicians} />
    </div>
  );
}
