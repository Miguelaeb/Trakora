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
import { ToolForm } from "../../tool-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTool(id: number) {
  const result = await sql`
    SELECT
      id,
      name,
      internal_code,
      category,
      notes,
      status
    FROM tools
    WHERE id = ${id}
  `;
  return result[0];
}

export default async function EditarHerramientaPage({ params }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const toolId = parseInt(id);

  if (isNaN(toolId)) {
    notFound();
  }

  const tool = await getTool(toolId);

  if (!tool) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/herramientas">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar Herramienta
          </h1>
          <p className="text-muted-foreground">
            Modifica los datos de {tool.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Herramienta</CardTitle>
          <CardDescription>
            Actualice los datos de la herramienta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToolForm tool={tool} />
        </CardContent>
      </Card>
    </div>
  );
}
