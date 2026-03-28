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
  assignToolToOrderDirectAction,
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
  const [requestOpen, setRequestOpen] = useState(false);
  const [directAddOpen, setDirectAddOpen] = useState(false);
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

  const activeAssignedToolIds = useMemo(() => {
    return new Set(activeTools.map((tool) => tool.tool_id));
  }, [activeTools]);

  const pendingRequestedToolIds = useMemo(() => {
    return new Set(pendingRequests.map((request) => request.tool_id));
  }, [pendingRequests]);

  const filteredAvailableTools = useMemo(() => {
    return availableTools.filter((tool) => {
      if (activeAssignedToolIds.has(tool.id)) return false;
      if (!isAdmin && pendingRequestedToolIds.has(tool.id)) return false;
      return true;
    });
  }, [availableTools, activeAssignedToolIds, pendingRequestedToolIds, isAdmin]);

  const resetToolSelection = () => {
    setSelectedTool("");
    setError(null);
  };

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

      resetToolSelection();
      setRequestOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al solicitar la herramienta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectAssignTool = async () => {
    if (!selectedTool) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.set("order_id", orderId.toString());
      formData.set("tool_id", selectedTool);

      const result = await assignToolToOrderDirectAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      resetToolSelection();
      setDirectAddOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al agregar la herramienta.");
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-5" />
              {isAdmin
                ? "Solicitudes de Herramientas"
                : "Herramientas de la Orden"}
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? "Aprueba o rechaza las solicitudes pendientes de herramientas"
                : "Solicita herramientas para usar en esta orden"}
            </CardDescription>
          </div>

          {!isAdmin && canEdit && filteredAvailableTools.length > 0 && (
            <Dialog
              open={requestOpen}
              onOpenChange={(value) => {
                setRequestOpen(value);
                if (!value) resetToolSelection();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="cursor-pointer">
                  <Plus className="mr-2 size-4" />
                  Solicitar Herramienta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Herramienta</DialogTitle>
                  <DialogDescription>
                    Seleccione una herramienta disponible para solicitar su uso
                    en esta orden
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="space-y-2">
                    <Label>Herramienta</Label>
                    <Select
                      value={selectedTool}
                      onValueChange={setSelectedTool}
                    >
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
                    className="cursor-pointer"
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

          {pendingRequests.length > 0 ? (
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
                        {new Date(request.created_at).toLocaleDateString(
                          "es-DO",
                        )}
                      </p>
                      <Badge variant="secondary">Pendiente</Badge>
                    </div>

                    {isAdmin && canEdit ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer disabled:cursor-not-allowed"
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={processingRequestId === request.id}
                        >
                          {processingRequestId === request.id
                            ? "Procesando..."
                            : "Aprobar"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer border-red-600 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
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
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay solicitudes pendientes de herramientas.
            </p>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="size-5" />
                Agregar Herramienta
              </CardTitle>
              <CardDescription>
                Como administrador, puedes asignar herramientas directamente a
                esta orden
              </CardDescription>
            </div>

            {canEdit && filteredAvailableTools.length > 0 && (
              <Dialog
                open={directAddOpen}
                onOpenChange={(value) => {
                  setDirectAddOpen(value);
                  if (!value) resetToolSelection();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="cursor-pointer">
                    <Plus className="mr-2 size-4" />
                    Agregar Herramienta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Herramienta</DialogTitle>
                    <DialogDescription>
                      Seleccione una herramienta disponible para asignarla
                      directamente a esta orden
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <div className="space-y-2">
                      <Label>Herramienta</Label>
                      <Select
                        value={selectedTool}
                        onValueChange={setSelectedTool}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar herramienta" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredAvailableTools.map((tool) => (
                            <SelectItem
                              key={tool.id}
                              value={tool.id.toString()}
                            >
                              {tool.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="cursor-pointer"
                      onClick={handleDirectAssignTool}
                      disabled={!selectedTool || isSubmitting}
                    >
                      {isSubmitting ? "Agregando..." : "Agregar Herramienta"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              La herramienta agregada por el administrador se asigna de
              inmediato a la orden y pasa a estado en uso.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="size-5" />
            Herramientas en Uso
          </CardTitle>
          <CardDescription>
            Herramientas activas y flujo de devolución
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {activeTools.length > 0 ? (
            <div className="space-y-2">
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
                          {new Date(tool.created_at).toLocaleDateString(
                            "es-DO",
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {tool.return_status === "pending_approval" && (
                          <Badge variant="secondary">
                            Pendiente de aprobación
                          </Badge>
                        )}

                        {tool.return_status === "rejected" && (
                          <Badge variant="destructive">
                            Solicitud rechazada
                          </Badge>
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
                                className="cursor-pointer disabled:cursor-not-allowed"
                                onClick={() =>
                                  handleApproveReturn(
                                    tool.order_tool_id,
                                    tool.tool_id,
                                  )
                                }
                                disabled={
                                  processingToolId === tool.order_tool_id
                                }
                              >
                                {processingToolId === tool.order_tool_id
                                  ? "Procesando..."
                                  : "Aprobar"}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer border-red-600 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
                                onClick={() =>
                                  handleRejectReturn(tool.order_tool_id)
                                }
                                disabled={
                                  processingToolId === tool.order_tool_id
                                }
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
                              className="cursor-pointer disabled:cursor-not-allowed"
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
                            className="cursor-pointer disabled:cursor-not-allowed"
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
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay herramientas activas en esta orden.
            </p>
          )}
        </CardContent>
      </Card>

      {reviewedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-5" />
              Historial de Solicitudes
            </CardTitle>
            <CardDescription>
              Solicitudes de herramientas ya procesadas
            </CardDescription>
          </CardHeader>

          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {returnedTools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-5" />
              Herramientas Devueltas
            </CardTitle>
            <CardDescription>
              Historial de herramientas ya devueltas
            </CardDescription>
          </CardHeader>

          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {pendingRequests.length === 0 &&
        activeTools.length === 0 &&
        returnedTools.length === 0 &&
        reviewedRequests.length === 0 && (
          <Card>
            <CardContent>
              <p className="py-8 text-center text-muted-foreground">
                No hay movimientos de herramientas en esta orden
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
