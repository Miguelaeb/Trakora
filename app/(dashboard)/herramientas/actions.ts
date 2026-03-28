"use server";

import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const allowedStatuses = ["available", "maintenance", "lost"] as const;

export async function createToolAction(_prevState: any, formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const internalCode = (formData.get("internal_code") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const status = (formData.get("status") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim();

  if (!name) {
    return { error: "El nombre es requerido" };
  }

  const dbStatus = allowedStatuses.includes(
    status as (typeof allowedStatuses)[number],
  )
    ? status
    : "available";

  await sql`
    INSERT INTO tools (
      name,
      internal_code,
      category,
      status,
      notes
    )
    VALUES (
      ${name},
      ${internalCode || null},
      ${category || null},
      ${dbStatus},
      ${notes || null}
    )
  `;

  revalidatePath("/herramientas");
  redirect("/herramientas");
}

export async function updateToolAction(_prevState: any, formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const parsedId = Number(id);

  const name = (formData.get("name") as string)?.trim();
  const internalCode = (formData.get("internal_code") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const status = (formData.get("status") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim();

  if (!parsedId || !name) {
    return { error: "El nombre es requerido" };
  }

  const dbStatus = allowedStatuses.includes(
    status as (typeof allowedStatuses)[number],
  )
    ? status
    : "available";

  await sql`
    UPDATE tools
    SET
      name = ${name},
      internal_code = ${internalCode || null},
      category = ${category || null},
      status = ${dbStatus},
      notes = ${notes || null},
      updated_at = NOW()
    WHERE id = ${parsedId}
  `;

  revalidatePath("/herramientas");
  revalidatePath(`/herramientas/${parsedId}/editar`);
  redirect("/herramientas");
}

export async function deleteToolAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const parsedId = Number(id);

  if (!parsedId) {
    return { error: "ID inválido" };
  }

  const tool = await sql`
    SELECT assigned_to, status
    FROM tools
    WHERE id = ${parsedId}
  `;

  if (tool.length === 0) {
    return { error: "Herramienta no encontrada" };
  }

  if (tool[0].assigned_to !== null || tool[0].status === "in_use") {
    return {
      error:
        "No se puede eliminar la herramienta porque está asignada o en uso en una orden activa",
    };
  }

  await sql`DELETE FROM order_tools WHERE tool_id = ${parsedId}`;
  await sql`DELETE FROM tools WHERE id = ${parsedId}`;

  revalidatePath("/herramientas");

  return { success: true };
}
