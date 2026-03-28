"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wrench, Plus, RotateCcw } from "lucide-react";
import {
  requestToolForOrderAction,
  returnToolAction,
  requestToolReturnAction,
  approveToolReturnAction,
  rejectToolReturnAction,
  approveToolRequestAction,
  rejectToolRequestAction,
} from "../actions";

interface OrderTool {
  order_tool_id: number;
  created_at: string;
  returned_at: string | null;
  return_status: "not_requested" | "pending_approval" | "approved" | "rejected";
  return_requested_at: string | null;
  return_requested_by: number | null;
  return_approved_at: string | null;
  return_approved_by: number | null;
  return_rejected_at: string | null;
  return_rejected_by: number | null;
  tool_id: number;
  name: string;
  status: string;
}

interface AvailableTool {
  id: number;
  name: string;
}

interface ToolRequest {
  id: number;
  order_id: number;
  tool_id: number;
  tool_name: string;
  requested_by: number;
  requested_by_name: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
}

interface OrderToolsSectionProps {
  orderId: number;
  orderTools: OrderTool[];
  availableTools: AvailableTool[];
  toolRequests: ToolRequest[];
  canEdit: boolean;
  isAdmin: boolean;
}

export function OrderToolsSection({
  orderId,
  orderTools,
  availableTools,
  toolRequests,
  canEdit,
  isAdmin,
}: OrderToolsSectionProps) {
  const [open, setOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingToolId, setProcessingToolId] = useState<number | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const activeTools = useMemo(
    () => orderTools.filter((t) => !t.returned_at),
    [orderTools],
  );

  const returnedTools = useMemo(
    () => orderTools.filter((t) => t.returned_at),
    [orderTools],
  );

  const pendingRequests = useMemo(
    () => toolRequests.filter((r) => r.status === "pending"),
    [toolRequests],
  );

  const reviewedRequests = useMemo(
    () => toolRequests.filter((r) => r.status !== "pending"),
    [toolRequests],
  );

  const requestedOrAssignedToolIds = useMemo(() => {
    const activeAssigned = activeTools.map((tool) => tool.tool_id);
    const pendingRequested = pendingRequests.map((request) => request.tool_id);

    return new Set([...activeAssigned, ...pendingRequested]);
  }, [activeTools, pendingRequests]);

  const filteredAvailableTools = useMemo(
    () =>
      availableTools.filter((tool) => !requestedOrAssignedToolIds.has(tool.id)),
    [availableTools, requestedOrAssignedToolIds],
  );

  const handleRequestTool = async () => {
    if (!selectedTool) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.set("order_id", orderId.toString());
      formData.set("tool_id", selectedTool);

      const result = await requestToolForOrderAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSelectedTool("");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al solicitar la herramienta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      setError(null);
      setProcessingRequestId(requestId);

      const formData = new FormData();
      formData.set("tool_request_id", requestId.toString());

      const result = await approveToolRequestAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al aprobar la solicitud.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      setError(null);
      setProcessingRequestId(requestId);

      const formData = new FormData();
      formData.set("tool_request_id", requestId.toString());

      const result = await rejectToolRequestAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al rechazar la solicitud.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleReturn = async (orderToolId: number, toolId: number) => {
    try {
      setError(null);
      setProcessingToolId(orderToolId);

      const formData = new FormData();
      formData.set("order_tool_id", orderToolId.toString());
      formData.set("tool_id", toolId.toString());

      const result = await returnToolAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al devolver la herramienta.");
    } finally {
      setProcessingToolId(null);
    }
  };

  const handleRequestReturn = async (orderToolId: number, toolId: number) => {
    try {
      setError(null);
      setProcessingToolId(orderToolId);

      const formData = new FormData();
      formData.set("order_tool_id", orderToolId.toString());
      formData.set("tool_id", toolId.toString());

      const result = await requestToolReturnAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al solicitar la devolución.");
    } finally {
      setProcessingToolId(null);
    }
  };

  const handleApproveReturn = async (orderToolId: number, toolId: number) => {
    try {
      setError(null);
      setProcessingToolId(orderToolId);

      const formData = new FormData();
      formData.set("order_tool_id", orderToolId.toString());
      formData.set("tool_id", toolId.toString());

      const result = await approveToolReturnAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al aprobar la devolución.");
    } finally {
      setProcessingToolId(null);
    }
  };

  const handleRejectReturn = async (orderToolId: number) => {
    try {
      setError(null);
      setProcessingToolId(orderToolId);

      const formData = new FormData();
      formData.set("order_tool_id", orderToolId.toString());

      const result = await rejectToolReturnAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al rechazar la devolución.");
    } finally {
      setProcessingToolId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="size-5" />
            Herramientas de la Orden
          </CardTitle>
          <CardDescription>
            Solicitudes, herramientas en uso y devoluciones
          </CardDescription>
        </div>

        {canEdit && filteredAvailableTools.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Solicitar Herramienta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Herramienta</DialogTitle>
                <DialogDescription>
                  Seleccione una herramienta disponible para solicitar su uso en
                  esta orden
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="space-y-2">
                  <Label>Herramienta</Label>
                  <Select value={selectedTool} onValueChange={setSelectedTool}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar herramienta" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAvailableTools.map((tool) => (
                        <SelectItem key={tool.id} value={tool.id.toString()}>
                          {tool.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleRequestTool}
                  disabled={!selectedTool || isSubmitting}
                >
                  {isSubmitting ? "Solicitando..." : "Solicitar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {pendingRequests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Solicitudes pendientes</h4>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{request.tool_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Solicitada por: {request.requested_by_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fecha:{" "}
                      {new Date(request.created_at).toLocaleDateString("es-DO")}
                    </p>
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>

                  {isAdmin && canEdit ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={processingRequestId === request.id}
                      >
                        {processingRequestId === request.id
                          ? "Procesando..."
                          : "Aprobar"}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequestId === request.id}
                      >
                        {processingRequestId === request.id
                          ? "Procesando..."
                          : "Rechazar"}
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="secondary">Pendiente de revisión</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTools.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">En uso</h4>
            <div className="space-y-2">
              {activeTools.map((tool) => (
                <div
                  key={tool.order_tool_id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Asignada:{" "}
                        {new Date(tool.created_at).toLocaleDateString("es-DO")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tool.return_status === "pending_approval" && (
                        <Badge variant="secondary">
                          Pendiente de aprobación
                        </Badge>
                      )}

                      {tool.return_status === "rejected" && (
                        <Badge variant="destructive">Solicitud rechazada</Badge>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex gap-2">
                      {isAdmin ? (
                        tool.return_status === "pending_approval" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleApproveReturn(
                                  tool.order_tool_id,
                                  tool.tool_id,
                                )
                              }
                              disabled={processingToolId === tool.order_tool_id}
                            >
                              {processingToolId === tool.order_tool_id
                                ? "Procesando..."
                                : "Aprobar"}
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleRejectReturn(tool.order_tool_id)
                              }
                              disabled={processingToolId === tool.order_tool_id}
                            >
                              {processingToolId === tool.order_tool_id
                                ? "Procesando..."
                                : "Rechazar"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleReturn(tool.order_tool_id, tool.tool_id)
                            }
                            disabled={processingToolId === tool.order_tool_id}
                          >
                            <RotateCcw className="mr-2 size-4" />
                            {processingToolId === tool.order_tool_id
                              ? "Devolviendo..."
                              : "Devolver"}
                          </Button>
                        )
                      ) : tool.return_status === "pending_approval" ? (
                        <Badge variant="secondary">
                          Pendiente de aprobación
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRequestReturn(
                              tool.order_tool_id,
                              tool.tool_id,
                            )
                          }
                          disabled={processingToolId === tool.order_tool_id}
                        >
                          <RotateCcw className="mr-2 size-4" />
                          {processingToolId === tool.order_tool_id
                            ? "Enviando..."
                            : tool.return_status === "rejected"
                              ? "Solicitar nuevamente"
                              : "Solicitar devolución"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {reviewedRequests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Historial de solicitudes
            </h4>
            <div className="space-y-2">
              {reviewedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-80"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{request.tool_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Solicitada por: {request.requested_by_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fecha:{" "}
                      {new Date(request.created_at).toLocaleDateString("es-DO")}
                    </p>
                    {request.rejection_reason && (
                      <p className="text-xs text-red-600">
                        Motivo: {request.rejection_reason}
                      </p>
                    )}
                  </div>

                  <Badge
                    variant={
                      request.status === "approved"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {request.status === "approved" ? "Aprobada" : "Rechazada"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {returnedTools.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Devueltas
            </h4>
            <div className="space-y-2">
              {returnedTools.map((tool) => (
                <div
                  key={tool.order_tool_id}
                  className="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-60"
                >
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Devuelta:{" "}
                      {new Date(tool.returned_at!).toLocaleDateString("es-DO")}
                    </p>
                  </div>
                  <Badge variant="secondary">Devuelta</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingRequests.length === 0 &&
          activeTools.length === 0 &&
          returnedTools.length === 0 &&
          reviewedRequests.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No hay movimientos de herramientas en esta orden
            </p>
          )}
      </CardContent>
    </Card>
  );
}
