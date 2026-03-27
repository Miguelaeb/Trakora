"use server";

import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const allowedStatuses = ["available", "in_use", "maintenance", "lost"];

export async function createToolAction(_prevState: any, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const internalCode = formData.get("internal_code") as string;
  const category = formData.get("category") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;

  if (!name) {
    return { error: "El nombre es requerido" };
  }

  const dbStatus = allowedStatuses.includes(status) ? status : "available";

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
  const name = formData.get("name") as string;
  const internalCode = formData.get("internal_code") as string;
  const category = formData.get("category") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;

  if (!id || !name) {
    return { error: "El nombre es requerido" };
  }

  const dbStatus = allowedStatuses.includes(status) ? status : "available";

  await sql`
    UPDATE tools
    SET
      name = ${name},
      internal_code = ${internalCode || null},
      category = ${category || null},
      status = ${dbStatus},
      notes = ${notes || null},
      updated_at = NOW()
    WHERE id = ${parseInt(id)}
  `;

  revalidatePath("/herramientas");
  revalidatePath(`/herramientas/${parseInt(id)}/editar`);
  redirect("/herramientas");
}

export async function deleteToolAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "ID inválido" };
  }

  const assigned = await sql`
    SELECT assigned_to
    FROM tools
    WHERE id = ${parseInt(id)}
  `;

  if (assigned.length === 0) {
    return { error: "Herramienta no encontrada" };
  }

  if (assigned[0].assigned_to !== null) {
    return {
      error:
        "No se puede eliminar la herramienta porque está asignada a un técnico u orden activa",
    };
  }

  await sql`DELETE FROM order_tools WHERE tool_id = ${parseInt(id)}`;
  await sql`DELETE FROM tools WHERE id = ${parseInt(id)}`;

  revalidatePath("/herramientas");

  return { success: true };
}
