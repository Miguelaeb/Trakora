"use client";

import { useState } from "react";
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
  assignToolToOrderAction,
  returnToolAction,
  requestToolReturnAction,
  approveToolReturnAction,
  rejectToolReturnAction,
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

interface OrderToolsSectionProps {
  orderId: number;
  orderTools: OrderTool[];
  availableTools: AvailableTool[];
  canEdit: boolean;
  isAdmin: boolean;
}

export function OrderToolsSection({
  orderId,
  orderTools,
  availableTools,
  canEdit,
  isAdmin,
}: OrderToolsSectionProps) {
  const [open, setOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingToolId, setProcessingToolId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    if (!selectedTool) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.set("order_id", orderId.toString());
      formData.set("tool_id", selectedTool);

      const result = await assignToolToOrderAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSelectedTool("");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al asignar la herramienta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async (orderToolId: number, toolId: number) => {
    setError(null);
    setProcessingToolId(orderToolId);

    const formData = new FormData();
    formData.set("order_tool_id", orderToolId.toString());
    formData.set("tool_id", toolId.toString());

    const result = await returnToolAction(formData);

    if (result?.error) {
      setError(result.error);
    }

    setProcessingToolId(null);
  };

  const handleRequestReturn = async (orderToolId: number, toolId: number) => {
    setError(null);
    setProcessingToolId(orderToolId);

    const formData = new FormData();
    formData.set("order_tool_id", orderToolId.toString());
    formData.set("tool_id", toolId.toString());

    const result = await requestToolReturnAction(formData);

    if (result?.error) {
      setError(result.error);
    }

    setProcessingToolId(null);
  };

  const handleApproveReturn = async (orderToolId: number, toolId: number) => {
    setError(null);
    setProcessingToolId(orderToolId);

    const formData = new FormData();
    formData.set("order_tool_id", orderToolId.toString());
    formData.set("tool_id", toolId.toString());

    const result = await approveToolReturnAction(formData);

    if (result?.error) {
      setError(result.error);
    }

    setProcessingToolId(null);
  };

  const handleRejectReturn = async (orderToolId: number) => {
    setError(null);
    setProcessingToolId(orderToolId);

    const formData = new FormData();
    formData.set("order_tool_id", orderToolId.toString());

    const result = await rejectToolReturnAction(formData);

    if (result?.error) {
      setError(result.error);
    }

    setProcessingToolId(null);
  };

  const activeTools = orderTools.filter((t) => !t.returned_at);
  const returnedTools = orderTools.filter((t) => t.returned_at);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="size-5" />
            Herramientas Asignadas
          </CardTitle>
          <CardDescription>
            Herramientas utilizadas en esta orden de servicio
          </CardDescription>
        </div>

        {canEdit && availableTools.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Asignar Herramienta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Herramienta</DialogTitle>
                <DialogDescription>
                  Seleccione una herramienta disponible para asignar a esta
                  orden
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
                      {availableTools.map((tool) => (
                        <SelectItem key={tool.id} value={tool.id.toString()}>
                          {tool.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAssign}
                  disabled={!selectedTool || isSubmitting}
                >
                  {isSubmitting ? "Asignando..." : "Asignar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        {error && !open && (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        )}

        {orderTools.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No hay herramientas asignadas a esta orden
          </p>
        ) : (
          <div className="space-y-4">
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
                                  variant="destructive"
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
                                onClick={() =>
                                  handleReturn(tool.order_tool_id, tool.tool_id)
                                }
                                disabled={
                                  processingToolId === tool.order_tool_id
                                }
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
                          {new Date(tool.returned_at!).toLocaleDateString(
                            "es-DO",
                          )}
                        </p>
                      </div>
                      <Badge variant="secondary">Devuelta</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
