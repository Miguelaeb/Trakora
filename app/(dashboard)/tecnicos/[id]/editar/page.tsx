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
import { TechnicianForm } from "../../technician-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTechnician(id: number) {
  const result = await sql`
    SELECT 
      id,
      full_name,
      email,
      phone,
      specialty,
      active
    FROM users
    WHERE id = ${id} AND role = 'technician'
  `;
  return result[0];
}

export default async function EditarTecnicoPage({ params }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const technicianId = parseInt(id);

  if (isNaN(technicianId)) {
    notFound();
  }

  const technician = await getTechnician(technicianId);

  if (!technician) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tecnicos">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Técnico</h1>
          <p className="text-muted-foreground">
            Modifica los datos de {technician.full_name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Técnico</CardTitle>
          <CardDescription>Actualice los datos del técnico</CardDescription>
        </CardHeader>
        <CardContent>
          <TechnicianForm technician={technician} />
        </CardContent>
      </Card>
    </div>
  );
}
