"use server";

import { sql } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type OrderStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

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

function isValidOrderStatus(status: string): status is OrderStatus {
  return ["new", "assigned", "in_progress", "completed", "cancelled"].includes(
    status,
  );
}

function getAllowedStatusesForRole(
  currentStatus: OrderStatus,
  isAdmin: boolean,
  hasTechnician: boolean,
): OrderStatus[] {
  if (isAdmin) {
    if (!hasTechnician) {
      if (currentStatus === "new") return ["new", "cancelled"];
      if (currentStatus === "cancelled") return ["cancelled"];
      return [currentStatus];
    }

    if (currentStatus === "new") return ["new", "assigned", "cancelled"];
    if (currentStatus === "assigned")
      return ["assigned", "in_progress", "cancelled"];
    if (currentStatus === "in_progress")
      return ["in_progress", "completed", "cancelled"];
    if (currentStatus === "completed") return ["completed"];
    if (currentStatus === "cancelled") return ["cancelled"];

    return [currentStatus];
  }

  if (currentStatus === "assigned") return ["assigned", "in_progress"];
  if (currentStatus === "in_progress") return ["in_progress", "completed"];
  if (currentStatus === "completed") return ["completed"];
  if (currentStatus === "cancelled") return ["cancelled"];
  if (currentStatus === "new") return ["new"];

  return [currentStatus];
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

  const initialStatus = assignedTo ? "assigned" : "new";
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
      ${initialStatus}
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
  const submittedStatus = formData.get("status") as string;
  const assignedToRaw = formData.get("assigned_to") as string;
  const scheduledDate = formData.get("scheduled_date") as string;
  const notes = formData.get("notes") as string;

  if (!id || !clientName || !description || !priority || !submittedStatus) {
    return { error: "Por favor complete los campos requeridos" };
  }

  if (!isValidOrderStatus(submittedStatus)) {
    return { error: "Estado inválido" };
  }

  let assignedTo =
    assignedToRaw &&
    assignedToRaw !== "unassigned" &&
    !Number.isNaN(Number(assignedToRaw))
      ? Number(assignedToRaw)
      : null;

  const currentOrder = await sql`
    SELECT status, assigned_to, completed_date
    FROM service_orders
    WHERE id = ${parseInt(id)}
    LIMIT 1
  `;

  if (currentOrder.length === 0) {
    return { error: "Orden no encontrada" };
  }

  let finalStatus: OrderStatus = submittedStatus;

  if (finalStatus === "cancelled") {
    assignedTo = null;
  }

  if (!assignedTo && ["new", "assigned"].includes(finalStatus)) {
    finalStatus = "new";
  }

  if (assignedTo && finalStatus === "new") {
    finalStatus = "assigned";
  }

  if (!assignedTo && finalStatus === "in_progress") {
    return {
      error: "No puede poner una orden en proceso sin técnico asignado",
    };
  }

  const completedDate =
    finalStatus === "completed" ? new Date().toISOString() : null;

  await sql`
    UPDATE service_orders
    SET 
      client_name = ${clientName},
      client_phone = ${clientPhone || null},
      client_address = ${clientAddress || null},
      description = ${description},
      priority = ${priority},
      status = ${finalStatus},
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
  const user = await requireAuth();

  const id = Number(formData.get("id"));

  if (!id || Number.isNaN(id)) {
    return { error: "ID inválido" };
  }

  const order = await sql`
    SELECT id, assigned_to, status
    FROM service_orders
    WHERE id = ${id}
    LIMIT 1
  `;

  if (order.length === 0) {
    return { error: "Orden no encontrada" };
  }

  const currentOrder = order[0];

  if (user.role !== "admin" && currentOrder.assigned_to !== user.id) {
    return { error: "No tiene permiso para completar esta orden" };
  }

  if (currentOrder.status !== "in_progress") {
    return {
      error: "Solo se puede completar una orden que esté en proceso",
    };
  }

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
  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!id || Number.isNaN(id)) {
    return { error: "ID inválido" };
  }

  const order = await sql`
    SELECT id, status
    FROM service_orders
    WHERE id = ${id}
    LIMIT 1
  `;

  if (order.length === 0) {
    return { error: "Orden no encontrada" };
  }

  if (order[0].status === "completed") {
    return { error: "No se puede cancelar una orden completada" };
  }

  const activeTools = await sql`
    SELECT tool_id
    FROM order_tools
    WHERE order_id = ${id}
      AND returned_at IS NULL
  `;

  for (const tool of activeTools) {
    await sql`
      UPDATE tools
      SET
        status = 'available',
        updated_at = NOW()
      WHERE id = ${tool.tool_id}
    `;
  }

  const usedMaterials = await sql`
    SELECT material_id, quantity_used
    FROM order_materials
    WHERE order_id = ${id}
  `;

  for (const material of usedMaterials) {
    await sql`
      UPDATE materials
      SET
        quantity_in_stock = quantity_in_stock + ${material.quantity_used},
        updated_at = NOW()
      WHERE id = ${material.material_id}
    `;
  }

  await sql`
    DELETE FROM order_tools
    WHERE order_id = ${id}
      AND returned_at IS NULL
  `;

  await sql`
    DELETE FROM order_materials
    WHERE order_id = ${id}
  `;

  await sql`
    DELETE FROM tool_requests
    WHERE order_id = ${id}
      AND status = 'pending'
  `;

  await sql`
    DELETE FROM material_requests
    WHERE order_id = ${id}
      AND status = 'pending'
  `;

  await sql`
    UPDATE service_orders
    SET 
      status = 'cancelled',
      assigned_to = NULL,
      completed_date = NULL,
      updated_at = NOW()
    WHERE id = ${id}
  `;

  revalidatePath("/ordenes");
  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/herramientas");
  revalidatePath("/materiales");

  return { success: true };
}

export async function updateOrderStatusAction(formData: FormData) {
  const user = await requireAuth();

  const id = formData.get("id") as string;
  const newStatusRaw = formData.get("status") as string;

  if (!id || !newStatusRaw) {
    return { error: "Datos inválidos" };
  }

  const orderId = parseInt(id);

  if (Number.isNaN(orderId)) {
    return { error: "ID inválido" };
  }

  if (!isValidOrderStatus(newStatusRaw)) {
    return { error: "Estado inválido" };
  }

  const order = await sql`
    SELECT id, assigned_to, status
    FROM service_orders
    WHERE id = ${orderId}
    LIMIT 1
  `;

  if (order.length === 0) {
    return { error: "Orden no encontrada" };
  }

  const currentOrder = order[0];
  const currentStatus = currentOrder.status as OrderStatus;
  const isAdmin = user.role === "admin";
  const hasTechnician = Boolean(currentOrder.assigned_to);

  if (!isAdmin && currentOrder.assigned_to !== user.id) {
    return { error: "No tiene permiso para actualizar esta orden" };
  }

  const allowedStatuses = getAllowedStatusesForRole(
    currentStatus,
    isAdmin,
    hasTechnician,
  );

  if (!allowedStatuses.includes(newStatusRaw)) {
    return { error: "No tiene permiso para realizar este cambio de estado" };
  }

  if (currentStatus === newStatusRaw) {
    return { success: true };
  }

  if (
    !hasTechnician &&
    ["assigned", "in_progress", "completed"].includes(newStatusRaw)
  ) {
    return {
      error: "Debe asignar un técnico antes de cambiar a ese estado",
    };
  }

  if (!isAdmin && newStatusRaw === "cancelled") {
    return { error: "Solo el administrador puede cancelar órdenes" };
  }

  if (
    !isAdmin &&
    currentStatus === "assigned" &&
    newStatusRaw === "completed"
  ) {
    return {
      error: "El técnico debe pasar la orden a En proceso antes de completarla",
    };
  }

  const completedDate =
    newStatusRaw === "completed" ? new Date().toISOString() : null;

  if (newStatusRaw === "cancelled") {
    const activeTools = await sql`
      SELECT tool_id
      FROM order_tools
      WHERE order_id = ${orderId}
        AND returned_at IS NULL
    `;

    for (const tool of activeTools) {
      await sql`
        UPDATE tools
        SET
          status = 'available',
          updated_at = NOW()
        WHERE id = ${tool.tool_id}
      `;
    }

    const usedMaterials = await sql`
      SELECT material_id, quantity_used
      FROM order_materials
      WHERE order_id = ${orderId}
    `;

    for (const material of usedMaterials) {
      await sql`
        UPDATE materials
        SET
          quantity_in_stock = quantity_in_stock + ${material.quantity_used},
          updated_at = NOW()
        WHERE id = ${material.material_id}
      `;
    }

    await sql`
      DELETE FROM order_tools
      WHERE order_id = ${orderId}
        AND returned_at IS NULL
    `;

    await sql`
      DELETE FROM order_materials
      WHERE order_id = ${orderId}
    `;

    await sql`
      DELETE FROM tool_requests
      WHERE order_id = ${orderId}
        AND status = 'pending'
    `;

    await sql`
      DELETE FROM material_requests
      WHERE order_id = ${orderId}
        AND status = 'pending'
    `;

    await sql`
      UPDATE service_orders
      SET 
        status = 'cancelled',
        assigned_to = NULL,
        completed_date = NULL,
        updated_at = NOW()
      WHERE id = ${orderId}
    `;
  } else {
    await sql`
      UPDATE service_orders
      SET 
        status = ${newStatusRaw},
        completed_date = ${completedDate},
        updated_at = NOW()
      WHERE id = ${orderId}
    `;
  }

  revalidatePath("/ordenes");
  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/herramientas");
  revalidatePath("/materiales");

  return { success: true };
}

export async function deleteOrderAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;

  if (!id) {
    return { error: "ID inválido" };
  }

  const orderId = parseInt(id);

  if (Number.isNaN(orderId)) {
    return { error: "ID inválido" };
  }

  const activeTools = await sql`
    SELECT tool_id
    FROM order_tools
    WHERE order_id = ${orderId}
      AND returned_at IS NULL
  `;

  for (const tool of activeTools) {
    await sql`
      UPDATE tools
      SET
        status = 'available',
        updated_at = NOW()
      WHERE id = ${tool.tool_id}
    `;
  }

  const usedMaterials = await sql`
    SELECT material_id, quantity_used
    FROM order_materials
    WHERE order_id = ${orderId}
  `;

  for (const material of usedMaterials) {
    await sql`
      UPDATE materials
      SET
        quantity_in_stock = quantity_in_stock + ${material.quantity_used},
        updated_at = NOW()
      WHERE id = ${material.material_id}
    `;
  }

  await sql`DELETE FROM order_tools WHERE order_id = ${orderId}`;
  await sql`DELETE FROM order_materials WHERE order_id = ${orderId}`;
  await sql`DELETE FROM tool_requests WHERE order_id = ${orderId}`;
  await sql`DELETE FROM material_requests WHERE order_id = ${orderId}`;
  await sql`DELETE FROM service_orders WHERE id = ${orderId}`;

  revalidatePath("/ordenes");
  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/herramientas");
  revalidatePath("/materiales");

  return { success: true };
}

export async function requestToolForOrderAction(formData: FormData) {
  const user = await requireAuth();

  const orderId = formData.get("order_id") as string;
  const toolId = formData.get("tool_id") as string;

  if (!orderId || !toolId) {
    return { error: "Datos inválidos" };
  }

  const parsedOrderId = parseInt(orderId);
  const parsedToolId = parseInt(toolId);

  if (Number.isNaN(parsedOrderId) || Number.isNaN(parsedToolId)) {
    return { error: "Datos inválidos" };
  }

  const order = await sql`
    SELECT assigned_to
    FROM service_orders
    WHERE id = ${parsedOrderId}
  `;

  if (order.length === 0) {
    return { error: "Orden no encontrada" };
  }

  if (user.role !== "admin" && order[0].assigned_to !== user.id) {
    return {
      error: "No tiene permiso para solicitar herramientas en esta orden",
    };
  }

  const tool = await sql`
    SELECT id, status
    FROM tools
    WHERE id = ${parsedToolId}
  `;

  if (tool.length === 0) {
    return { error: "Herramienta no encontrada" };
  }

  if (tool[0].status !== "available") {
    return { error: "La herramienta no está disponible" };
  }

  const existingPendingRequest = await sql`
    SELECT id
    FROM tool_requests
    WHERE order_id = ${parsedOrderId}
      AND tool_id = ${parsedToolId}
      AND status = 'pending'
    LIMIT 1
  `;

  if (existingPendingRequest.length > 0) {
    return { error: "Ya existe una solicitud pendiente para esta herramienta" };
  }

  const existingActiveAssignment = await sql`
    SELECT id
    FROM order_tools
    WHERE order_id = ${parsedOrderId}
      AND tool_id = ${parsedToolId}
      AND returned_at IS NULL
    LIMIT 1
  `;

  if (existingActiveAssignment.length > 0) {
    return { error: "Esta herramienta ya está asignada a esta orden" };
  }

  await sql`
    INSERT INTO tool_requests (
      order_id,
      tool_id,
      requested_by,
      status
    )
    VALUES (
      ${parsedOrderId},
      ${parsedToolId},
      ${user.id},
      'pending'
    )
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${parsedOrderId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function assignToolToOrderAction(formData: FormData) {
  return assignToolToOrderDirectAction(formData);
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

export async function approveToolRequestAction(formData: FormData) {
  const user = await requireAdmin();

  const requestId = formData.get("tool_request_id") as string;

  if (!requestId) {
    return { error: "Datos inválidos" };
  }

  const parsedRequestId = parseInt(requestId);

  if (Number.isNaN(parsedRequestId)) {
    return { error: "Datos inválidos" };
  }

  const request = await sql`
    SELECT
      tr.id,
      tr.order_id,
      tr.tool_id,
      tr.status,
      t.status AS tool_status
    FROM tool_requests tr
    JOIN tools t ON t.id = tr.tool_id
    WHERE tr.id = ${parsedRequestId}
    LIMIT 1
  `;

  if (request.length === 0) {
    return { error: "Solicitud no encontrada" };
  }

  const currentRequest = request[0];

  if (currentRequest.status !== "pending") {
    return { error: "La solicitud ya fue procesada" };
  }

  if (currentRequest.tool_status !== "available") {
    return { error: "La herramienta ya no está disponible" };
  }

  const existingAssignment = await sql`
    SELECT id, returned_at
    FROM order_tools
    WHERE order_id = ${currentRequest.order_id}
      AND tool_id = ${currentRequest.tool_id}
    LIMIT 1
  `;

  if (existingAssignment.length > 0) {
    return {
      error: "La herramienta ya fue registrada anteriormente en esta orden",
    };
  }

  await sql`
    UPDATE tool_requests
    SET
      status = 'approved',
      reviewed_by = ${user.id},
      reviewed_at = NOW(),
      rejection_reason = NULL
    WHERE id = ${parsedRequestId}
  `;

  await sql`
    INSERT INTO order_tools (order_id, tool_id)
    VALUES (${currentRequest.order_id}, ${currentRequest.tool_id})
  `;

  await sql`
    UPDATE tools
    SET
      status = 'in_use',
      updated_at = NOW()
    WHERE id = ${currentRequest.tool_id}
  `;

  await sql`
    UPDATE tool_requests
    SET
      status = 'rejected',
      rejection_reason = 'La herramienta fue asignada a otra orden',
      reviewed_by = ${user.id},
      reviewed_at = NOW()
    WHERE tool_id = ${currentRequest.tool_id}
      AND status = 'pending'
      AND id <> ${parsedRequestId}
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${currentRequest.order_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/herramientas");

  return { success: true };
}

export async function rejectToolRequestAction(formData: FormData) {
  const user = await requireAdmin();

  const requestId = formData.get("tool_request_id") as string;
  const rejectionReason =
    (formData.get("rejection_reason") as string)?.trim() || null;

  if (!requestId) {
    return { error: "Datos inválidos" };
  }

  const parsedRequestId = parseInt(requestId);

  if (Number.isNaN(parsedRequestId)) {
    return { error: "Datos inválidos" };
  }

  const request = await sql`
    SELECT
      id,
      order_id,
      tool_id,
      status
    FROM tool_requests
    WHERE id = ${parsedRequestId}
    LIMIT 1
  `;

  if (request.length === 0) {
    return { error: "Solicitud no encontrada" };
  }

  const currentRequest = request[0];

  if (currentRequest.status !== "pending") {
    return { error: "La solicitud ya fue procesada" };
  }

  await sql`
    UPDATE tool_requests
    SET
      status = 'rejected',
      rejection_reason = ${rejectionReason},
      reviewed_by = ${user.id},
      reviewed_at = NOW()
    WHERE id = ${parsedRequestId}
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${currentRequest.order_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/herramientas");

  return { success: true };
}

// Materiales

export async function requestMaterialForOrderAction(formData: FormData) {
  const user = await requireAuth();

  const orderId = formData.get("order_id") as string;
  const materialId = formData.get("material_id") as string;
  const quantity = formData.get("quantity") as string;
  const justification = (formData.get("justification") as string)?.trim();

  if (!orderId || !materialId || !quantity || !justification) {
    return { error: "Debe completar todos los campos requeridos" };
  }

  const parsedOrderId = parseInt(orderId);
  const parsedMaterialId = parseInt(materialId);
  const qty = Number(quantity);

  if (
    Number.isNaN(parsedOrderId) ||
    Number.isNaN(parsedMaterialId) ||
    Number.isNaN(qty)
  ) {
    return { error: "Datos inválidos" };
  }

  if (qty <= 0) {
    return { error: "La cantidad debe ser mayor a cero" };
  }

  const order = await sql`
    SELECT id, assigned_to, status
    FROM service_orders
    WHERE id = ${parsedOrderId}
    LIMIT 1
  `;

  if (order.length === 0) {
    return { error: "Orden no encontrada" };
  }

  const currentOrder = order[0];

  if (["completed", "cancelled"].includes(currentOrder.status)) {
    return { error: "No se pueden solicitar materiales para esta orden" };
  }

  if (user.role !== "admin" && currentOrder.assigned_to !== user.id) {
    return {
      error: "No tiene permiso para solicitar materiales en esta orden",
    };
  }

  const material = await sql`
    SELECT id, quantity_in_stock
    FROM materials
    WHERE id = ${parsedMaterialId}
    LIMIT 1
  `;

  if (material.length === 0) {
    return { error: "Material no encontrado" };
  }

  if (Number(material[0].quantity_in_stock) <= 0) {
    return { error: "Este material no tiene stock disponible" };
  }

  const existingPendingRequest = await sql`
    SELECT id
    FROM material_requests
    WHERE order_id = ${parsedOrderId}
      AND material_id = ${parsedMaterialId}
      AND status = 'pending'
    LIMIT 1
  `;

  if (existingPendingRequest.length > 0) {
    return { error: "Ya existe una solicitud pendiente para este material" };
  }

  await sql`
    INSERT INTO material_requests (
      order_id,
      material_id,
      quantity_requested,
      justification,
      status,
      requested_by
    )
    VALUES (
      ${parsedOrderId},
      ${parsedMaterialId},
      ${qty},
      ${justification},
      'pending',
      ${user.id}
    )
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${parsedOrderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/materiales");

  return { success: true };
}

export async function approveMaterialRequestAction(formData: FormData) {
  const user = await requireAdmin();

  const requestId = formData.get("request_id") as string;

  if (!requestId) {
    return { error: "Datos inválidos" };
  }

  const parsedRequestId = parseInt(requestId);

  if (Number.isNaN(parsedRequestId)) {
    return { error: "Datos inválidos" };
  }

  const request = await sql`
    SELECT
      mr.id,
      mr.order_id,
      mr.material_id,
      mr.quantity_requested,
      mr.status,
      m.quantity_in_stock
    FROM material_requests mr
    JOIN materials m ON m.id = mr.material_id
    WHERE mr.id = ${parsedRequestId}
    LIMIT 1
  `;

  if (request.length === 0) {
    return { error: "Solicitud no encontrada" };
  }

  const currentRequest = request[0];
  const requestedQty = Number(currentRequest.quantity_requested);
  const stock = Number(currentRequest.quantity_in_stock);

  if (currentRequest.status !== "pending") {
    return { error: "La solicitud ya fue procesada" };
  }

  if (requestedQty <= 0) {
    return { error: "La cantidad solicitada es inválida" };
  }

  if (stock < requestedQty) {
    return { error: "Stock insuficiente para aprobar esta solicitud" };
  }

  await sql`
    UPDATE material_requests
    SET
      status = 'approved',
      reviewed_by = ${user.id},
      reviewed_at = NOW(),
      rejection_reason = NULL,
      updated_at = NOW()
    WHERE id = ${parsedRequestId}
  `;

  await sql`
    UPDATE materials
    SET
      quantity_in_stock = quantity_in_stock - ${requestedQty},
      updated_at = NOW()
    WHERE id = ${currentRequest.material_id}
  `;

  await sql`
    INSERT INTO order_materials (
      order_id,
      material_id,
      quantity_used
    )
    VALUES (
      ${currentRequest.order_id},
      ${currentRequest.material_id},
      ${requestedQty}
    )
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${currentRequest.order_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/materiales");

  return { success: true };
}

export async function rejectMaterialRequestAction(formData: FormData) {
  const user = await requireAdmin();

  const requestId = formData.get("request_id") as string;
  const rejectionReason =
    (formData.get("rejection_reason") as string)?.trim() || null;

  if (!requestId) {
    return { error: "Datos inválidos" };
  }

  const parsedRequestId = parseInt(requestId);

  if (Number.isNaN(parsedRequestId)) {
    return { error: "Datos inválidos" };
  }

  const request = await sql`
    SELECT id, order_id, status
    FROM material_requests
    WHERE id = ${parsedRequestId}
    LIMIT 1
  `;

  if (request.length === 0) {
    return { error: "Solicitud no encontrada" };
  }

  const currentRequest = request[0];

  if (currentRequest.status !== "pending") {
    return { error: "La solicitud ya fue procesada" };
  }

  await sql`
    UPDATE material_requests
    SET
      status = 'rejected',
      rejection_reason = ${rejectionReason},
      reviewed_by = ${user.id},
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = ${parsedRequestId}
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${currentRequest.order_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/materiales");

  return { success: true };
}

export async function addMaterialToOrderDirectAction(formData: FormData) {
  await requireAdmin();

  const orderId = formData.get("order_id") as string;
  const materialId = formData.get("material_id") as string;
  const quantity = formData.get("quantity") as string;

  if (!orderId || !materialId || !quantity) {
    return { error: "Datos inválidos" };
  }

  const parsedOrderId = parseInt(orderId);
  const parsedMaterialId = parseInt(materialId);
  const qty = Number(quantity);

  if (
    Number.isNaN(parsedOrderId) ||
    Number.isNaN(parsedMaterialId) ||
    Number.isNaN(qty)
  ) {
    return { error: "Datos inválidos" };
  }

  if (qty <= 0) {
    return { error: "La cantidad debe ser mayor a cero" };
  }

  const order = await sql`
    SELECT id, status
    FROM service_orders
    WHERE id = ${parsedOrderId}
    LIMIT 1
  `;

  if (order.length === 0) {
    return { error: "Orden no encontrada" };
  }

  if (["completed", "cancelled"].includes(order[0].status)) {
    return { error: "No se pueden agregar materiales a esta orden" };
  }

  const material = await sql`
    SELECT id, quantity_in_stock
    FROM materials
    WHERE id = ${parsedMaterialId}
    LIMIT 1
  `;

  if (material.length === 0) {
    return { error: "Material no encontrado" };
  }

  if (Number(material[0].quantity_in_stock) < qty) {
    return { error: "Stock insuficiente" };
  }

  await sql`
    INSERT INTO order_materials (
      order_id,
      material_id,
      quantity_used
    )
    VALUES (
      ${parsedOrderId},
      ${parsedMaterialId},
      ${qty}
    )
  `;

  await sql`
    UPDATE materials
    SET
      quantity_in_stock = quantity_in_stock - ${qty},
      updated_at = NOW()
    WHERE id = ${parsedMaterialId}
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${parsedOrderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/materiales");

  return { success: true };
}

export async function assignToolToOrderDirectAction(formData: FormData) {
  const user = await requireAdmin();

  const orderId = formData.get("order_id") as string;
  const toolId = formData.get("tool_id") as string;

  if (!orderId || !toolId) {
    return { error: "Datos inválidos" };
  }

  const parsedOrderId = parseInt(orderId);
  const parsedToolId = parseInt(toolId);

  if (Number.isNaN(parsedOrderId) || Number.isNaN(parsedToolId)) {
    return { error: "Datos inválidos" };
  }

  const order = await sql`
    SELECT id, status
    FROM service_orders
    WHERE id = ${parsedOrderId}
    LIMIT 1
  `;

  if (order.length === 0) {
    return { error: "Orden no encontrada" };
  }

  if (["completed", "cancelled"].includes(order[0].status)) {
    return { error: "No se pueden agregar herramientas a esta orden" };
  }

  const tool = await sql`
    SELECT id, status
    FROM tools
    WHERE id = ${parsedToolId}
    LIMIT 1
  `;

  if (tool.length === 0) {
    return { error: "Herramienta no encontrada" };
  }

  if (tool[0].status !== "available") {
    return { error: "La herramienta no está disponible" };
  }

  const existingAssignment = await sql`
    SELECT id
    FROM order_tools
    WHERE order_id = ${parsedOrderId}
      AND tool_id = ${parsedToolId}
    LIMIT 1
  `;

  if (existingAssignment.length > 0) {
    return {
      error: "La herramienta ya fue registrada anteriormente en esta orden",
    };
  }

  await sql`
    INSERT INTO order_tools (order_id, tool_id)
    VALUES (${parsedOrderId}, ${parsedToolId})
  `;

  await sql`
    UPDATE tools
    SET
      status = 'in_use',
      updated_at = NOW()
    WHERE id = ${parsedToolId}
  `;

  await sql`
    UPDATE tool_requests
    SET
      status = 'rejected',
      rejection_reason = 'La herramienta fue asignada directamente por un administrador',
      reviewed_by = ${user.id},
      reviewed_at = NOW()
    WHERE tool_id = ${parsedToolId}
      AND status = 'pending'
  `;

  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${parsedOrderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/herramientas");

  return { success: true };
}

export async function assignMaterialToOrderAction(formData: FormData) {
  return addMaterialToOrderDirectAction(formData);
}
