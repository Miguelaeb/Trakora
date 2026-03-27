"use server";

import { sql } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `OS-${year}${month}${day}-${random}`;
}

export async function createOrderAction(_prevState: any, formData: FormData) {
  const user = await requireAdmin();

  const clientName = formData.get("client_name") as string;
  const clientPhone = formData.get("client_phone") as string;
  const clientAddress = formData.get("client_address") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;
  const assignedToRaw = formData.get("assigned_to") as string;
  const scheduledDate = formData.get("scheduled_date") as string;

  if (!clientName || !description || !priority) {
    return { error: "Por favor complete los campos requeridos" };
  }

  const assignedTo =
    assignedToRaw &&
    assignedToRaw !== "unassigned" &&
    !Number.isNaN(Number(assignedToRaw))
      ? Number(assignedToRaw)
      : null;

  const orderNumber = generateOrderNumber();

  await sql`
    INSERT INTO service_orders (
      order_number,
      client_name,
      client_phone,
      client_address,
      description,
      priority,
      assigned_to,
      scheduled_date,
      service_date,
      service_type,
      created_by,
      status
    )
    VALUES (
      ${orderNumber},
      ${clientName},
      ${clientPhone || null},
      ${clientAddress || null},
      ${description},
      ${priority},
      ${assignedTo},
      ${scheduledDate || null},
      ${scheduledDate || new Date().toISOString().split("T")[0]},
      ${"Servicio general"},
      ${user.id},
      ${assignedTo ? "assigned" : "pending"}
    )
  `;

  revalidatePath("/ordenes");
  revalidatePath("/dashboard");
  redirect("/ordenes");
}

export async function updateOrderAction(_prevState: any, formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const clientName = formData.get("client_name") as string;
  const clientPhone = formData.get("client_phone") as string;
  const clientAddress = formData.get("client_address") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;
  const status = formData.get("status") as string;
  const assignedToRaw = formData.get("assigned_to") as string;
  const scheduledDate = formData.get("scheduled_date") as string;
  const notes = formData.get("notes") as string;

  if (!id || !clientName || !description || !priority || !status) {
    return { error: "Por favor complete los campos requeridos" };
  }

  const allowedStatuses = [
    "pending",
    "assigned",
    "in_progress",
    "completed",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    return { error: "Estado inválido" };
  }

  const assignedTo =
    assignedToRaw &&
    assignedToRaw !== "unassigned" &&
    !Number.isNaN(Number(assignedToRaw))
      ? Number(assignedToRaw)
      : null;

  const completedDate = ["completed", "cancelled"].includes(status)
    ? new Date().toISOString()
    : null;

  await sql`
    UPDATE service_orders
    SET 
      client_name = ${clientName},
      client_phone = ${clientPhone || null},
      client_address = ${clientAddress || null},
      description = ${description},
      priority = ${priority},
      status = ${status},
      assigned_to = ${assignedTo},
      scheduled_date = ${scheduledDate || null},
      service_date = ${scheduledDate || new Date().toISOString().split("T")[0]},
      service_type = ${"Servicio general"},
      notes = ${notes || null},
      completed_date = ${completedDate},
      updated_at = NOW()
    WHERE id = ${parseInt(id)}
  `;

  revalidatePath("/ordenes");
  revalidatePath("/dashboard");
  revalidatePath("/historial");
  redirect("/ordenes");
}

export async function completeOrderAction(formData: FormData) {
  await requireAuth();

  const id = Number(formData.get("id"));

  await sql`
    UPDATE service_orders
    SET 
      status = 'completed',
      completed_date = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
  `;

  revalidatePath("/ordenes");
  revalidatePath("/dashboard");
  revalidatePath("/historial");

  return { success: true };
}

export async function cancelOrderAction(formData: FormData) {
  await requireAuth();

  const id = Number(formData.get("id"));

  await sql`
    UPDATE service_orders
    SET 
      status = 'cancelled',
      completed_date = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
  `;

  revalidatePath("/ordenes");
  revalidatePath("/dashboard");
  revalidatePath("/historial");

  return { success: true };
}

export async function updateOrderStatusAction(formData: FormData) {
  const user = await requireAuth();

  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  if (!id || !status) {
    return { error: "Datos inválidos" };
  }

  const allowedStatuses = [
    "pending",
    "assigned",
    "in_progress",
    "completed",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    return { error: "Estado inválido" };
  }

  const order = await sql`
    SELECT assigned_to
    FROM service_orders
    WHERE id = ${parseInt(id)}
  `;

  if (order.length === 0) {
    return { error: "Orden no encontrada" };
  }

  if (user.role !== "admin" && order[0].assigned_to !== user.id) {
    return { error: "No tiene permiso para actualizar esta orden" };
  }

  const completedDate = ["completed", "cancelled"].includes(status)
    ? new Date().toISOString()
    : null;

  await sql`
    UPDATE service_orders
    SET 
      status = ${status},
      completed_date = ${completedDate},
      updated_at = NOW()
    WHERE id = ${parseInt(id)}
  `;

  revalidatePath("/ordenes");
  revalidatePath("/dashboard");
  revalidatePath("/historial");

  return { success: true };
}

export async function deleteOrderAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "ID inválido" };
  }

  await sql`DELETE FROM order_tools WHERE order_id = ${parseInt(id)}`;
  await sql`DELETE FROM order_materials WHERE order_id = ${parseInt(id)}`;
  await sql`DELETE FROM service_orders WHERE id = ${parseInt(id)}`;

  revalidatePath("/ordenes");
  revalidatePath("/dashboard");
  revalidatePath("/historial");

  return { success: true };
}

export async function assignToolToOrderAction(formData: FormData) {
  await requireAuth();

  const orderId = formData.get("order_id") as string;
  const toolId = formData.get("tool_id") as string;

  if (!orderId || !toolId) {
    return { error: "Datos inválidos" };
  }

  const parsedOrderId = parseInt(orderId);
  const parsedToolId = parseInt(toolId);

  const tool = await sql`
    SELECT status
    FROM tools
    WHERE id = ${parsedToolId}
  `;

  if (tool.length === 0 || tool[0].status !== "available") {
    return { error: "La herramienta no está disponible" };
  }

  // Verifica si ya existe una asignación de esta herramienta a esta orden
  const existingAssignment = await sql`
    SELECT id, returned_at
    FROM order_tools
    WHERE order_id = ${parsedOrderId}
      AND tool_id = ${parsedToolId}
    LIMIT 1
  `;

  if (existingAssignment.length > 0) {
    const assignment = existingAssignment[0];

    // Si existe y NO ha sido devuelta, ya está asignada
    if (!assignment.returned_at) {
      return { error: "Esta herramienta ya está asignada a esta orden" };
    }

    // Si existe pero ya fue devuelta, se reutiliza el registro
    await sql`
      UPDATE order_tools
      SET
        created_at = NOW(),
        returned_at = NULL,
        return_status = 'not_requested',
        return_requested_at = NULL,
        return_requested_by = NULL,
        return_approved_at = NULL,
        return_approved_by = NULL,
        return_rejected_at = NULL,
        return_rejected_by = NULL
      WHERE id = ${assignment.id}
    `;
  } else {
    // Si nunca ha existido, insertar normal
    await sql`
      INSERT INTO order_tools (order_id, tool_id)
      VALUES (${parsedOrderId}, ${parsedToolId})
    `;
  }

  await sql`
    UPDATE tools
    SET status = 'in_use'
    WHERE id = ${parsedToolId}
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${parsedOrderId}`);

  return { success: true };
}

export async function requestToolReturnAction(formData: FormData) {
  const user = await requireAuth();

  const orderToolId = formData.get("order_tool_id") as string;

  if (!orderToolId) {
    return { error: "Datos inválidos" };
  }

  const orderTool = await sql`
    SELECT 
      ot.id, 
      ot.order_id, 
      ot.return_status,
      ot.returned_at,
      so.assigned_to
    FROM order_tools ot
    JOIN service_orders so ON so.id = ot.order_id
    WHERE ot.id = ${parseInt(orderToolId)}
  `;

  if (orderTool.length === 0) {
    return { error: "Asignación de herramienta no encontrada" };
  }

  const assignment = orderTool[0];

  if (user.role !== "admin" && assignment.assigned_to !== user.id) {
    return { error: "No tiene permiso para solicitar esta devolución" };
  }

  if (assignment.returned_at) {
    return { error: "Esta herramienta ya fue devuelta" };
  }

  if (assignment.return_status === "pending_approval") {
    return { error: "Esta devolución ya está pendiente de aprobación" };
  }

  await sql`
    UPDATE order_tools
    SET
      return_status = 'pending_approval',
      return_requested_at = NOW(),
      return_requested_by = ${user.id},
      return_approved_at = NULL,
      return_approved_by = NULL,
      return_rejected_at = NULL,
      return_rejected_by = NULL
    WHERE id = ${parseInt(orderToolId)}
      AND returned_at IS NULL
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${assignment.order_id}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function approveToolReturnAction(formData: FormData) {
  const user = await requireAdmin();

  const orderToolId = formData.get("order_tool_id") as string;

  if (!orderToolId) {
    return { error: "Datos inválidos" };
  }

  const orderTool = await sql`
    SELECT order_id, tool_id, return_status, returned_at
    FROM order_tools
    WHERE id = ${parseInt(orderToolId)}
  `;

  if (orderTool.length === 0) {
    return { error: "Asignación de herramienta no encontrada" };
  }

  const assignment = orderTool[0];

  if (assignment.returned_at) {
    return { error: "Esta herramienta ya fue devuelta" };
  }

  if (assignment.return_status !== "pending_approval") {
    return { error: "La devolución no está pendiente de aprobación" };
  }

  await sql`
    UPDATE order_tools
    SET
      returned_at = NOW(),
      return_status = 'approved',
      return_approved_at = NOW(),
      return_approved_by = ${user.id},
      return_rejected_at = NULL,
      return_rejected_by = NULL
    WHERE id = ${parseInt(orderToolId)}
  `;

  await sql`
    UPDATE tools
    SET status = 'available'
    WHERE id = ${assignment.tool_id}
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${assignment.order_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/herramientas");

  return { success: true };
}

export async function rejectToolReturnAction(formData: FormData) {
  const user = await requireAdmin();

  const orderToolId = formData.get("order_tool_id") as string;

  if (!orderToolId) {
    return { error: "Datos inválidos" };
  }

  const orderTool = await sql`
    SELECT order_id, return_status, returned_at
    FROM order_tools
    WHERE id = ${parseInt(orderToolId)}
  `;

  if (orderTool.length === 0) {
    return { error: "Asignación de herramienta no encontrada" };
  }

  const assignment = orderTool[0];

  if (assignment.returned_at) {
    return { error: "Esta herramienta ya fue devuelta" };
  }

  if (assignment.return_status !== "pending_approval") {
    return { error: "La devolución no está pendiente de aprobación" };
  }

  await sql`
    UPDATE order_tools
    SET
      return_status = 'rejected',
      return_rejected_at = NOW(),
      return_rejected_by = ${user.id}
    WHERE id = ${parseInt(orderToolId)}
      AND returned_at IS NULL
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${assignment.order_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/herramientas");

  return { success: true };
}

export async function assignMaterialToOrderAction(formData: FormData) {
  await requireAuth();

  const orderId = formData.get("order_id") as string;
  const materialId = formData.get("material_id") as string;
  const quantity = formData.get("quantity") as string;

  if (!orderId || !materialId || !quantity) {
    return { error: "Datos inválidos" };
  }

  const qty = parseInt(quantity);
  if (qty <= 0) {
    return { error: "La cantidad debe ser mayor a cero" };
  }

  const material = await sql`
    SELECT quantity_in_stock
    FROM materials
    WHERE id = ${parseInt(materialId)}
  `;

  if (material.length === 0 || material[0].quantity_in_stock < qty) {
    return { error: "Stock insuficiente" };
  }

  await sql`
    INSERT INTO order_materials (order_id, material_id, quantity_used)
    VALUES (${parseInt(orderId)}, ${parseInt(materialId)}, ${qty})
  `;

  await sql`
    UPDATE materials
    SET quantity_in_stock = quantity_in_stock - ${qty}
    WHERE id = ${parseInt(materialId)}
  `;

  revalidatePath(`/ordenes/${orderId}`);

  return { success: true };
}

export async function returnToolAction(formData: FormData) {
  const user = await requireAuth();

  const orderToolId = formData.get("order_tool_id") as string;
  const toolId = formData.get("tool_id") as string;

  if (!orderToolId || !toolId) {
    return { error: "Datos inválidos" };
  }

  const orderTool = await sql`
    SELECT ot.order_id, so.assigned_to
    FROM order_tools ot
    JOIN service_orders so ON so.id = ot.order_id
    WHERE ot.id = ${parseInt(orderToolId)}
  `;

  if (orderTool.length === 0) {
    return { error: "Asignación de herramienta no encontrada" };
  }

  const assignment = orderTool[0];

  if (user.role !== "admin" && assignment.assigned_to !== user.id) {
    return { error: "No tiene permiso para devolver esta herramienta" };
  }

  if (user.role !== "admin") {
    return {
      error: "Solo el administrador puede confirmar la devolución directa",
    };
  }

  await sql`
    UPDATE order_tools
    SET
      returned_at = NOW(),
      return_status = 'approved',
      return_approved_at = NOW(),
      return_approved_by = ${user.id}
    WHERE id = ${parseInt(orderToolId)}
  `;

  await sql`
    UPDATE tools
    SET status = 'available'
    WHERE id = ${parseInt(toolId)}
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${assignment.order_id}`);
  revalidatePath("/dashboard");

  return { success: true };
}
