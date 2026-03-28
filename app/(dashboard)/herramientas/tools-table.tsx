"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Edit,
  MoreHorizontal,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { deleteToolAction } from "./actions";
import {
  approveToolReturnAction,
  rejectToolReturnAction,
  approveToolRequestAction,
  rejectToolRequestAction,
} from "../ordenes/actions";

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

interface ToolsTableProps {
  tools: Tool[];
  initialSearch: string;
  initialStatus: string;
}

const allowedStatuses = ["todos", "available", "in_use", "maintenance", "lost"];

const statusLabels: Record<string, string> = {
  available: "Disponible",
  in_use: "En uso",
  maintenance: "Mantenimiento",
  lost: "Pérdida",
};

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  in_use: "bg-blue-100 text-blue-800",
  maintenance: "bg-amber-100 text-amber-800",
  lost: "bg-red-100 text-red-800",
};

const returnStatusLabels: Record<string, string> = {
  not_requested: "",
  pending_approval: "Pendiente devolución",
  approved: "Devuelta",
  rejected: "Devolución rechazada",
};

const returnStatusColors: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800",
  approved: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-800",
};

const requestStatusLabels: Record<string, string> = {
  pending: "Solicitud pendiente",
  approved: "Solicitud aprobada",
  rejected: "Solicitud rechazada",
};

const requestStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function ToolsTable({
  tools,
  initialSearch,
  initialStatus,
}: ToolsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const safeInitialStatus = allowedStatuses.includes(initialStatus)
    ? initialStatus
    : "todos";

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(safeInitialStatus);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessingReturn, setIsProcessingReturn] = useState<number | null>(
    null,
  );
  const [isProcessingRequest, setIsProcessingRequest] = useState<number | null>(
    null,
  );

  const selectedTool = useMemo(
    () => tools.find((tool) => tool.id === deleteId) ?? null,
    [deleteId, tools],
  );

  const updateFilters = (nextSearch: string, nextStatus: string) => {
    const params = new URLSearchParams();

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    }

    if (nextStatus && nextStatus !== "todos") {
      params.set("status", nextStatus);
    }

    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      setError(null);

      const formData = new FormData();
      formData.set("id", deleteId.toString());

      const result = await deleteToolAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch {
      setError("Ocurrió un error al intentar eliminar la herramienta.");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleApproveReturn = async (tool: Tool) => {
    if (!tool.order_tool_id) return;

    try {
      setIsProcessingReturn(tool.id);
      setError(null);

      const formData = new FormData();
      formData.set("order_tool_id", tool.order_tool_id.toString());

      const result = await approveToolReturnAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch {
      setError("Ocurrió un error al aprobar la devolución.");
    } finally {
      setIsProcessingReturn(null);
    }
  };

  const handleRejectReturn = async (tool: Tool) => {
    if (!tool.order_tool_id) return;

    try {
      setIsProcessingReturn(tool.id);
      setError(null);

      const formData = new FormData();
      formData.set("order_tool_id", tool.order_tool_id.toString());

      const result = await rejectToolReturnAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch {
      setError("Ocurrió un error al rechazar la devolución.");
    } finally {
      setIsProcessingReturn(null);
    }
  };

  const handleApproveRequest = async (tool: Tool) => {
    if (!tool.request_id) return;

    try {
      setIsProcessingRequest(tool.id);
      setError(null);

      const formData = new FormData();
      formData.set("tool_request_id", tool.request_id.toString());

      const result = await approveToolRequestAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch {
      setError("Ocurrió un error al aprobar la solicitud.");
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (tool: Tool) => {
    if (!tool.request_id) return;

    try {
      setIsProcessingRequest(tool.id);
      setError(null);

      const formData = new FormData();
      formData.set("tool_request_id", tool.request_id.toString());

      const result = await rejectToolRequestAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch {
      setError("Ocurrió un error al rechazar la solicitud.");
    } finally {
      setIsProcessingRequest(null);
    }
  };

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="underline underline-offset-4"
            >
              Cerrar
            </button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código, categoría o notas..."
                value={search}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearch(value);
                  updateFilters(value, statusFilter);
                }}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                updateFilters(search, value);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="in_use">En uso</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="lost">Pérdida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isPending && (
            <p className="mt-3 text-xs text-muted-foreground">Buscando...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código Interno</TableHead>
                <TableHead className="hidden md:table-cell">
                  Categoría
                </TableHead>
                <TableHead className="hidden lg:table-cell">Notas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {tools.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No se encontraron herramientas
                  </TableCell>
                </TableRow>
              ) : (
                tools.map((tool) => {
                  const normalizedStatus = tool.status?.toLowerCase().trim();
                  const normalizedReturnStatus =
                    tool.return_status?.toLowerCase().trim() || null;
                  const normalizedRequestStatus =
                    tool.request_status?.toLowerCase().trim() || null;

                  const hasPendingRequest =
                    normalizedRequestStatus === "pending";
                  const hasPendingReturn =
                    normalizedReturnStatus === "pending_approval";
                  const hasApprovedReturn =
                    normalizedReturnStatus === "approved";
                  const hasRejectedReturn =
                    normalizedReturnStatus === "rejected";

                  let badgeLabel =
                    statusLabels[normalizedStatus] || tool.status || "-";
                  let badgeClass =
                    statusColors[normalizedStatus] ||
                    "bg-muted text-muted-foreground";

                  if (hasPendingRequest) {
                    badgeLabel =
                      requestStatusLabels[normalizedRequestStatus!] ||
                      badgeLabel;
                    badgeClass =
                      requestStatusColors[normalizedRequestStatus!] ||
                      badgeClass;
                  } else if (
                    hasPendingReturn ||
                    hasApprovedReturn ||
                    hasRejectedReturn
                  ) {
                    badgeLabel =
                      returnStatusLabels[normalizedReturnStatus!] || badgeLabel;
                    badgeClass =
                      returnStatusColors[normalizedReturnStatus!] || badgeClass;
                  }

                  return (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name}</TableCell>

                      <TableCell>{tool.internal_code || "-"}</TableCell>

                      <TableCell className="hidden md:table-cell">
                        {tool.category || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell max-w-xs">
                        <div className="space-y-1">
                          <p className="truncate text-muted-foreground">
                            {tool.notes || "-"}
                          </p>

                          {tool.request_date && hasPendingRequest && (
                            <p className="text-xs text-amber-700">
                              Solicitud:{" "}
                              {new Date(tool.request_date).toLocaleDateString(
                                "es-DO",
                              )}
                            </p>
                          )}

                          {tool.return_requested_at && hasPendingReturn && (
                            <p className="text-xs text-amber-700">
                              Solicitud:{" "}
                              {new Date(
                                tool.return_requested_at,
                              ).toLocaleDateString("es-DO")}
                            </p>
                          )}

                          {tool.rejection_reason &&
                            normalizedRequestStatus === "rejected" && (
                              <p className="text-xs text-red-600 truncate">
                                Motivo: {tool.rejection_reason}
                              </p>
                            )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={`${badgeClass} border-0`}>
                          {badgeLabel}
                        </Badge>

                        {hasPendingRequest && tool.requested_by_name && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tool.requested_by_name}
                          </p>
                        )}

                        {hasPendingRequest && tool.request_order_id && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Orden #{tool.request_order_id}
                          </p>
                        )}

                        {!hasPendingRequest && tool.assigned_to_name && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {tool.assigned_to_name}
                          </p>
                        )}

                        {!hasPendingRequest && tool.order_id && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Orden #{tool.order_id}
                          </p>
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
                            {hasPendingRequest && tool.request_order_id && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/ordenes/${tool.request_order_id}`}
                                >
                                  <Eye className="mr-2 size-4" />
                                  Ver orden
                                </Link>
                              </DropdownMenuItem>
                            )}

                            {!hasPendingRequest && tool.order_id && (
                              <DropdownMenuItem asChild>
                                <Link href={`/ordenes/${tool.order_id}`}>
                                  <Eye className="mr-2 size-4" />
                                  Ver orden
                                </Link>
                              </DropdownMenuItem>
                            )}

                            {hasPendingRequest && tool.request_id && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApproveRequest(tool)}
                                  disabled={isProcessingRequest === tool.id}
                                >
                                  <CheckCircle2 className="mr-2 size-4" />
                                  {isProcessingRequest === tool.id
                                    ? "Aprobando..."
                                    : "Aprobar solicitud"}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleRejectRequest(tool)}
                                  disabled={isProcessingRequest === tool.id}
                                >
                                  <XCircle className="mr-2 size-4" />
                                  {isProcessingRequest === tool.id
                                    ? "Procesando..."
                                    : "Rechazar solicitud"}
                                </DropdownMenuItem>
                              </>
                            )}

                            {hasPendingReturn && tool.order_tool_id && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApproveReturn(tool)}
                                  disabled={isProcessingReturn === tool.id}
                                >
                                  <CheckCircle2 className="mr-2 size-4" />
                                  {isProcessingReturn === tool.id
                                    ? "Aprobando..."
                                    : "Aprobar devolución"}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleRejectReturn(tool)}
                                  disabled={isProcessingReturn === tool.id}
                                >
                                  <XCircle className="mr-2 size-4" />
                                  {isProcessingReturn === tool.id
                                    ? "Procesando..."
                                    : "Rechazar devolución"}
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuItem asChild>
                              <Link href={`/herramientas/${tool.id}/editar`}>
                                <Edit className="mr-2 size-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(tool.id)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Eliminar
                            </DropdownMenuItem>
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
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar herramienta?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTool ? (
                <>
                  Se eliminará permanentemente la herramienta{" "}
                  <span className="font-medium text-foreground">
                    {selectedTool.name}
                  </span>
                  . Esta acción no se puede deshacer.
                </>
              ) : (
                "Esta acción no se puede deshacer. La herramienta será eliminada permanentemente."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
