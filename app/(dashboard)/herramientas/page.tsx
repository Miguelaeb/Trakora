import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ToolsTable } from "./tools-table";

export const metadata = {
  title: "Herramientas - Trakora",
};

const allowedStatuses = ["todos", "available", "in_use", "maintenance", "lost"];

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

async function getTools(search = "", status = "todos") {
  const searchPattern = `%${search}%`;

  return sql`
    SELECT
      t.id,
      t.name,
      t.internal_code,
      t.category,
      t.notes,
      t.status,
      so.assigned_to,
      u.full_name AS assigned_to_name,
      ot.id AS order_tool_id,
      ot.order_id,
      ot.return_status,
      ot.return_requested_at
    FROM tools t
    LEFT JOIN order_tools ot
      ON ot.tool_id = t.id
      AND ot.returned_at IS NULL
    LEFT JOIN service_orders so
      ON so.id = ot.order_id
    LEFT JOIN users u
      ON u.id = so.assigned_to
    WHERE
      (
        ${search === ""}
        OR unaccent(lower(t.name)) ILIKE unaccent(lower(${searchPattern}))
        OR unaccent(lower(coalesce(t.internal_code, ''))) ILIKE unaccent(lower(${searchPattern}))
        OR unaccent(lower(coalesce(t.category, ''))) ILIKE unaccent(lower(${searchPattern}))
        OR unaccent(lower(coalesce(t.notes, ''))) ILIKE unaccent(lower(${searchPattern}))
      )
      AND (
        ${status === "todos"} OR t.status = ${status}
      )
    ORDER BY t.name
  `;
}

export default async function HerramientasPage({ searchParams }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const search = params.search ?? "";
  const status = allowedStatuses.includes(params.status ?? "")
    ? (params.status as string)
    : "todos";

  const tools = await getTools(search, status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Herramientas</h1>
          <p className="text-muted-foreground">
            Gestiona el inventario de herramientas
          </p>
        </div>

        <Button asChild>
          <Link href="/herramientas/nueva">
            <Plus className="mr-2 size-4" />
            Nueva Herramienta
          </Link>
        </Button>
      </div>

      <ToolsTable tools={tools} initialSearch={search} initialStatus={status} />
    </div>
  );
}
