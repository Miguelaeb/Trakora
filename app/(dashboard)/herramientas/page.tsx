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

interface Tool {
  id: number;
  name: string;
  internal_code: string | null;
  category: string | null;
  notes: string | null;
  status: string;
  assigned_to_name: string | null;
  order_tool_id: number | null;
  order_id: number | null;
  return_status: string | null;
  return_requested_at: string | null;
  request_id: number | null;
  request_status: "pending" | "approved" | "rejected" | null;
  request_date: string | null;
  requested_by_name: string | null;
  request_order_id: number | null;
  rejection_reason: string | null;
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

async function getTools(search = "", status = "todos"): Promise<Tool[]> {
  const searchPattern = `%${search}%`;

  const result = await sql`
    SELECT
      t.id,
      t.name,
      t.internal_code,
      t.category,
      t.notes,
      t.status,

      u.full_name AS assigned_to_name,
      ot.id AS order_tool_id,
      ot.order_id,
      ot.return_status,
      ot.return_requested_at,

      tr.id AS request_id,
      tr.status AS request_status,
      tr.created_at AS request_date,
      tr.rejection_reason,
      requester.full_name AS requested_by_name,
      tr.order_id AS request_order_id

    FROM tools t

    LEFT JOIN order_tools ot
      ON ot.tool_id = t.id
      AND ot.returned_at IS NULL

    LEFT JOIN service_orders so
      ON so.id = ot.order_id

    LEFT JOIN users u
      ON u.id = so.assigned_to

    LEFT JOIN tool_requests tr
      ON tr.tool_id = t.id
      AND tr.status = 'pending'

    LEFT JOIN users requester
      ON requester.id = tr.requested_by

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

  return result as Tool[];
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
