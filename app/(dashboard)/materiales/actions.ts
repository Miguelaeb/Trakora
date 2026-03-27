"use server";

import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createMaterialAction(
  _prevState: any,
  formData: FormData,
) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const unit = formData.get("unit") as string;
  const quantityInStock = formData.get("quantity_in_stock") as string;
  const minStockLevel = formData.get("min_stock_level") as string;

  if (!name || !unit) {
    return { error: "El nombre y la unidad son requeridos" };
  }

  await sql`
    INSERT INTO materials (
      name,
      category,
      unit,
      quantity_in_stock,
      min_stock_level
    )
    VALUES (
      ${name},
      ${category || null},
      ${unit},
      ${parseInt(quantityInStock) || 0},
      ${parseInt(minStockLevel) || 0}
    )
  `;

  revalidatePath("/materiales");
  redirect("/materiales");
}

export async function updateMaterialAction(
  _prevState: any,
  formData: FormData,
) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const unit = formData.get("unit") as string;
  const quantityInStock = formData.get("quantity_in_stock") as string;
  const minStockLevel = formData.get("min_stock_level") as string;

  if (!id || !name || !unit) {
    return { error: "El nombre y la unidad son requeridos" };
  }

  await sql`
    UPDATE materials
    SET
      name = ${name},
      category = ${category || null},
      unit = ${unit},
      quantity_in_stock = ${parseInt(quantityInStock) || 0},
      min_stock_level = ${parseInt(minStockLevel) || 0},
      updated_at = NOW()
    WHERE id = ${parseInt(id)}
  `;

  revalidatePath("/materiales");
  redirect("/materiales");
}

export async function deleteMaterialAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "ID inválido" };
  }

  await sql`DELETE FROM order_materials WHERE material_id = ${parseInt(id)}`;
  await sql`DELETE FROM materials WHERE id = ${parseInt(id)}`;

  revalidatePath("/materiales");

  return { success: true };
}

export async function adjustStockAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const adjustment = formData.get("adjustment") as string;
  const type = formData.get("type") as "add" | "subtract";

  if (!id || !adjustment) {
    return { error: "Datos inválidos" };
  }

  const amount = parseInt(adjustment);
  if (isNaN(amount) || amount <= 0) {
    return { error: "La cantidad debe ser un número positivo" };
  }

  if (type === "add") {
    await sql`
      UPDATE materials
      SET quantity_in_stock = quantity_in_stock + ${amount},
          updated_at = NOW()
      WHERE id = ${parseInt(id)}
    `;
  } else {
    await sql`
      UPDATE materials
      SET quantity_in_stock = GREATEST(quantity_in_stock - ${amount}, 0),
          updated_at = NOW()
      WHERE id = ${parseInt(id)}
    `;
  }

  revalidatePath("/materiales");

  return { success: true };
}
