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
import { MaterialForm } from "../../material-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMaterial(id: number) {
  const result = await sql`
    SELECT id, name, category, unit, quantity_in_stock, min_stock_level
    FROM materials
    WHERE id = ${id}
  `;
  return result[0];
}

export default async function EditarMaterialPage({ params }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const materialId = parseInt(id);

  if (isNaN(materialId)) {
    notFound();
  }

  const material = await getMaterial(materialId);

  if (!material) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/materiales">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Material</h1>
          <p className="text-muted-foreground">
            Modifica los datos de {material.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Material</CardTitle>
          <CardDescription>Actualice los datos del material</CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialForm material={material} />
        </CardContent>
      </Card>
    </div>
  );
}
