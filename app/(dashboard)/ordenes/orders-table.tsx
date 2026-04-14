"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Edit,
  MoreHorizontal,
  Search,
  Trash2,
  AlertTriangle,
  Wrench,
  Package,
  RotateCcw,
  CheckCircle2,
  X,
} from "lucide-react";
import { deleteOrderAction, updateOrderStatusAction } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Order {
  id: number;
  order_number: string;
  client_name: string;
  client_phone: string | null;
  client_address: string | null;
  description: string;
  status: string;
  priority: string;
  scheduled_date: string | null;
  created_at: string;
  technician_name: string | null;
  pending_tool_requests?: number | string;
  pending_material_requests?: number | string;
  pending_tool_returns?: number | string;
}

interface OrdersTableProps {
  orders: Order[];
  isAdmin: boolean;
}

type OrderStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

type FeedbackState = {
  type: "error" | "success" | "warning";
  title: string;
  message: string;
} | null;

const statusLabels: Record<OrderStatus, string> = {
  new: "Nueva",
  assigned: "Asignada",
  in_progress: "En proceso",
  completed: "Completada",
  cancelled: "Cancelada",
};

const priorityLabels: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

const priorityColors: Record<string, string> = {
  baja: "bg-muted text-muted-foreground",
  media: "bg-blue-100 text-blue-800",
  alta: "bg-amber-100 text-amber-800",
  urgente: "bg-red-100 text-red-800",
};

const statusColors: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  assigned: "bg-sky-100 text-sky-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function isValidOrderStatus(status: string): status is OrderStatus {
  return ["new", "assigned", "in_progress", "completed", "cancelled"].includes(
    status,
  );
}

function getAllowedStatuses(
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

function getAlertClasses(type: FeedbackState["type"]) {
  switch (type) {
    case "success":
      return "border-green-300 bg-green-50 text-green-900";
    case "warning":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "error":
    default:
      return "border-red-300 bg-red-50 text-red-900";
  }
}

export function OrdersTable({ orders, isAdmin }: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [priorityFilter, setPriorityFilter] = useState<string>("todos");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.client_name.toLowerCase().includes(search.toLowerCase()) ||
      order.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "todos" || order.status === statusFilter;
    const matchesPriority =
      priorityFilter === "todos" || order.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const clearFeedback = () => setFeedback(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    const formData = new FormData();
    formData.set("id", deleteId.toString());

    const result = await deleteOrderAction(formData);

    if (result?.error) {
      setFeedback({
        type: "error",
        title: "No se pudo eliminar la orden",
        message: result.error,
      });
      return;
    }

    setDeleteId(null);
    clearFeedback();
  };

  const handleStatusChange = async (
    orderId: number,
    currentStatus: OrderStatus,
    newStatus: string,
    hasTechnician: boolean,
    pendingReturns: number,
  ) => {
    if (!isValidOrderStatus(newStatus)) return;

    const allowedStatuses = getAllowedStatuses(
      currentStatus,
      isAdmin,
      hasTechnician,
    );

    if (!allowedStatuses.includes(newStatus)) {
      setFeedback({
        type: "error",
        title: "Acción no permitida",
        message: "No tienes permiso para realizar este cambio de estado.",
      });
      return;
    }

    if (currentStatus === newStatus) return;

    if (newStatus === "completed" && pendingReturns > 0) {
      setFeedback({
        type: "warning",
        title: "No se puede completar la orden",
        message:
          "Aún hay herramientas pendientes de devolución. Debes devolverlas antes de marcar esta orden como completada.",
      });
      return;
    }

    const formData = new FormData();
    formData.set("id", orderId.toString());
    formData.set("status", newStatus);

    const result = await updateOrderStatusAction(formData);

    if (result?.error) {
      setFeedback({
        type: "error",
        title: "No se pudo actualizar el estado",
        message: result.error,
      });
      return;
    }

    clearFeedback();
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  {statusFilter === "todos"
                    ? "Todos los estados"
                    : statusLabels[statusFilter as OrderStatus] || "Estado"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="new">Nueva</SelectItem>
                  <SelectItem value="assigned">Asignada</SelectItem>
                  <SelectItem value="in_progress">En proceso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  {priorityFilter === "todos"
                    ? "Todas"
                    : priorityLabels[priorityFilter] || "Prioridad"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <Alert className={`mt-4 ${getAlertClasses(feedback.type)}`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}

          <div className="flex w-full items-start justify-between gap-4">
            <div className="min-w-0">
              <AlertTitle>{feedback.title}</AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={clearFeedback}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar alerta</span>
            </Button>
          </div>
        </Alert>
      )}

      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">
                  Descripción
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead className="hidden lg:table-cell">Técnico</TableHead>
                <TableHead>Pendientes</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No se encontraron órdenes
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const pendingTools = Number(order.pending_tool_requests || 0);
                  const pendingMaterials = Number(
                    order.pending_material_requests || 0,
                  );
                  const pendingReturns = Number(
                    order.pending_tool_returns || 0,
                  );

                  const totalPending =
                    pendingTools + pendingMaterials + pendingReturns;
                  const hasPending = totalPending > 0;

                  const currentStatus: OrderStatus = isValidOrderStatus(
                    order.status,
                  )
                    ? order.status
                    : "new";

                  const hasTechnician = Boolean(order.technician_name);
                  const allowedStatuses = getAllowedStatuses(
                    currentStatus,
                    isAdmin,
                    hasTechnician,
                  );

                  return (
                    <TableRow
                      key={order.id}
                      className={hasPending ? "bg-amber-50/40" : ""}
                    >
                      <TableCell
                        className={
                          hasPending ? "border-l-4 border-l-amber-400" : ""
                        }
                      >
                        <Link
                          href={`/ordenes/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">{order.client_name}</p>
                          {order.client_phone && (
                            <p className="text-xs text-muted-foreground">
                              {order.client_phone}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden max-w-xs md:table-cell">
                        <p className="truncate">{order.description}</p>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={currentStatus}
                          onValueChange={(value) =>
                            handleStatusChange(
                              order.id,
                              currentStatus,
                              value,
                              hasTechnician,
                              pendingReturns,
                            )
                          }
                          disabled={allowedStatuses.length <= 1}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <Badge
                              className={`${statusColors[currentStatus]} border-0`}
                            >
                              {statusLabels[currentStatus]}
                            </Badge>
                          </SelectTrigger>

                          <SelectContent>
                            {allowedStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusLabels[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`${priorityColors[order.priority] || "bg-muted text-muted-foreground"} border-0`}
                        >
                          {priorityLabels[order.priority] || order.priority}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        {order.technician_name || (
                          <span className="text-muted-foreground">
                            Sin asignar
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {hasPending ? (
                          <div className="flex flex-wrap gap-2">
                            {pendingMaterials > 0 && (
                              <Badge className="border-0 bg-amber-100 text-amber-800">
                                <Package className="mr-1 size-3" />
                                {pendingMaterials} material
                                {pendingMaterials > 1 ? "es" : ""}
                              </Badge>
                            )}

                            {pendingTools > 0 && (
                              <Badge className="border-0 bg-sky-100 text-sky-800">
                                <Wrench className="mr-1 size-3" />
                                {pendingTools} herramienta
                                {pendingTools > 1 ? "s" : ""}
                              </Badge>
                            )}

                            {pendingReturns > 0 && (
                              <div className="flex flex-col gap-1">
                                <Badge className="border-0 bg-orange-100 text-orange-800">
                                  <RotateCcw className="mr-1 size-3" />
                                  {pendingReturns} devolución
                                  {pendingReturns > 1 ? "es" : ""}
                                </Badge>

                                <span className="text-xs font-medium text-red-600">
                                  No se puede completar hasta devolver la
                                  herramienta
                                </span>
                              </div>
                            )}

                            {isAdmin && (
                              <Link
                                href={`/ordenes/${order.id}`}
                                className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline"
                              >
                                <AlertTriangle className="size-3.5" />
                                Revisar
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Sin pendientes
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/ordenes/${order.id}`}>
                                <Eye className="mr-2 size-4" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>

                            {isAdmin && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/ordenes/${order.id}/editar`}>
                                    <Edit className="mr-2 size-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteId(order.id)}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos
              asociados a esta orden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
