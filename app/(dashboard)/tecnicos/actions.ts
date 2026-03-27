"use server";

import { sql } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTechnicianAction(
  _prevState: any,
  formData: FormData,
) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const specialty = formData.get("specialty") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!name || !email || !password || !confirmPassword) {
    return { error: "Por favor complete todos los campos requeridos" };
  }

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden" };
  }

  const existing = await sql`
    SELECT id 
    FROM users 
    WHERE email = ${email.toLowerCase()}
  `;

  if (existing.length > 0) {
    return { error: "Ya existe un usuario con este correo electrónico" };
  }

  const passwordHash = await hashPassword(password);

  await sql`
    INSERT INTO users (
      full_name,
      email,
      phone,
      specialty,
      password_hash,
      role,
      availability_status,
      active,
      created_at,
      updated_at
    )
    VALUES (
      ${name},
      ${email.toLowerCase()},
      ${phone || null},
      ${specialty || null},
      ${passwordHash},
      'technician',
      'available',
      true,
      NOW(),
      NOW()
    )
  `;

  revalidatePath("/tecnicos");
  redirect("/tecnicos");
}

export async function updateTechnicianAction(
  _prevState: any,
  formData: FormData,
) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const specialty = formData.get("specialty") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;
  const active = formData.get("active") === "true";

  if (!id || !name || !email) {
    return { error: "Por favor complete los campos requeridos" };
  }

  const existing = await sql`
    SELECT id 
    FROM users 
    WHERE email = ${email.toLowerCase()} 
      AND id != ${parseInt(id)}
  `;

  if (existing.length > 0) {
    return { error: "Ya existe otro usuario con este correo electrónico" };
  }

  if (password && password.length > 0) {
    if (password.length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres" };
    }

    if (password !== confirmPassword) {
      return { error: "Las contraseñas no coinciden" };
    }

    const passwordHash = await hashPassword(password);

    await sql`
      UPDATE users
      SET
        full_name = ${name},
        email = ${email.toLowerCase()},
        phone = ${phone || null},
        specialty = ${specialty || null},
        password_hash = ${passwordHash},
        active = ${active},
        updated_at = NOW()
      WHERE id = ${parseInt(id)}
    `;
  } else {
    await sql`
      UPDATE users
      SET
        full_name = ${name},
        email = ${email.toLowerCase()},
        phone = ${phone || null},
        specialty = ${specialty || null},
        active = ${active},
        updated_at = NOW()
      WHERE id = ${parseInt(id)}
    `;
  }

  revalidatePath("/tecnicos");
  redirect("/tecnicos");
}

export async function deleteTechnicianAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "ID inválido" };
  }

  const orders = await sql`
    SELECT COUNT(*) as count 
    FROM service_orders 
    WHERE assigned_to = ${parseInt(id)}
  `;

  if (Number(orders[0].count) > 0) {
    return {
      error: "No se puede eliminar el técnico porque tiene órdenes asignadas",
    };
  }

  await sql`
    DELETE FROM users 
    WHERE id = ${parseInt(id)} 
      AND role = 'technician'
  `;

  revalidatePath("/tecnicos");

  return { success: true };
}

export async function toggleTechnicianStatusAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const currentActive = formData.get("active") === "true";

  if (!id) {
    return { error: "ID inválido" };
  }

  await sql`
    UPDATE users
    SET
      active = ${!currentActive},
      updated_at = NOW()
    WHERE id = ${parseInt(id)}
  `;

  revalidatePath("/tecnicos");

  return { success: true };
}
