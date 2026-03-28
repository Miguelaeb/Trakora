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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Package, Plus } from "lucide-react";
import {
  requestMaterialForOrderAction,
  addMaterialToOrderDirectAction,
  approveMaterialRequestAction,
  rejectMaterialRequestAction,
} from "../actions";

interface OrderMaterial {
  order_material_id: number;
  quantity_used: number;
  created_at?: string;
  assigned_at?: string;
  material_id: number;
  name: string;
  unit: string;
}

interface AvailableMaterial {
  id: number;
  name: string;
  unit: string;
  quantity_in_stock: number;
}

interface MaterialRequest {
  id: number;
  order_id: number;
  material_id: number;
  material_name: string;
  material_unit: string;
  quantity_requested: number;
  justification: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  requested_by: number;
  requested_by_name: string;
  reviewed_by: number | null;
  reviewed_by_name?: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at?: string;
}

interface OrderMaterialsSectionProps {
  orderId: number;
  orderMaterials: OrderMaterial[];
  availableMaterials: AvailableMaterial[];
  materialRequests: MaterialRequest[];
  canEdit: boolean;
  isAdmin: boolean;
}

const requestStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const requestStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-0",
  approved: "bg-green-100 text-green-800 border-0",
  rejected: "bg-red-100 text-red-800 border-0",
};

export function OrderMaterialsSection({
  orderId,
  orderMaterials,
  availableMaterials,
  materialRequests,
  canEdit,
  isAdmin,
}: OrderMaterialsSectionProps) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [directAddOpen, setDirectAddOpen] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [processingRequestId, setProcessingRequestId] = useState<number | null>(
    null,
  );
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const selectedMaterialData = availableMaterials.find(
    (m) => m.id.toString() === selectedMaterial,
  );

  const resetForm = () => {
    setSelectedMaterial("");
    setQuantity("1");
    setJustification("");
    setError(null);
  };

  const handleRequestSubmit = async () => {
    if (!selectedMaterial || !quantity || !justification.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("order_id", orderId.toString());
    formData.set("material_id", selectedMaterial);
    formData.set("quantity", quantity);
    formData.set("justification", justification.trim());

    const result = await requestMaterialForOrderAction(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    resetForm();
    setRequestOpen(false);
    setIsSubmitting(false);
  };

  const handleDirectAddSubmit = async () => {
    if (!selectedMaterial || !quantity) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("order_id", orderId.toString());
    formData.set("material_id", selectedMaterial);
    formData.set("quantity", quantity);

    const result = await addMaterialToOrderDirectAction(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    resetForm();
    setDirectAddOpen(false);
    setIsSubmitting(false);
  };

  const handleApprove = async (requestId: number) => {
    setProcessingRequestId(requestId);

    const formData = new FormData();
    formData.set("request_id", requestId.toString());

    const result = await approveMaterialRequestAction(formData);

    if (result?.error) {
      alert(result.error);
      setProcessingRequestId(null);
      return;
    }

    setProcessingRequestId(null);
  };

  const openRejectDialog = (requestId: number) => {
    setRequestToReject(requestId);
    setRejectionReason("");
    setRejectError(null);
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!requestToReject) return;

    if (!rejectionReason.trim()) {
      setRejectError("Debe indicar un motivo de rechazo.");
      return;
    }

    setProcessingRequestId(requestToReject);
    setRejectError(null);

    const formData = new FormData();
    formData.set("request_id", requestToReject.toString());
    formData.set("rejection_reason", rejectionReason.trim());

    const result = await rejectMaterialRequestAction(formData);

    if (result?.error) {
      setRejectError(result.error);
      setProcessingRequestId(null);
      return;
    }

    setRejectDialogOpen(false);
    setRequestToReject(null);
    setRejectionReason("");
    setProcessingRequestId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Solicitudes de Materiales
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? "Aprueba o rechaza las solicitudes pendientes de materiales"
                : "Solicitudes de materiales para esta orden de servicio"}
            </CardDescription>
          </div>

          {!isAdmin && canEdit && availableMaterials.length > 0 && (
            <Dialog
              open={requestOpen}
              onOpenChange={(value) => {
                setRequestOpen(value);
                if (!value) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="cursor-pointer">
                  <Plus className="mr-2 size-4" />
                  Solicitar Material
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Material</DialogTitle>
                  <DialogDescription>
                    Seleccione un material, la cantidad requerida y una
                    justificación
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Select
                      value={selectedMaterial}
                      onValueChange={setSelectedMaterial}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar material" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMaterials.map((material) => (
                          <SelectItem
                            key={material.id}
                            value={material.id.toString()}
                          >
                            {material.name} ({material.quantity_in_stock}{" "}
                            {material.unit} disponibles)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Cantidad{" "}
                      {selectedMaterialData && `(${selectedMaterialData.unit})`}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max={selectedMaterialData?.quantity_in_stock || 999999}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                    {selectedMaterialData && (
                      <p className="text-xs text-muted-foreground">
                        Máximo disponible:{" "}
                        {selectedMaterialData.quantity_in_stock}{" "}
                        {selectedMaterialData.unit}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Justificación</Label>
                    <Textarea
                      placeholder="Explique por qué necesita este material para la orden"
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button
                    className="cursor-pointer"
                    onClick={handleRequestSubmit}
                    disabled={
                      !selectedMaterial ||
                      !quantity ||
                      !justification.trim() ||
                      isSubmitting
                    }
                  >
                    {isSubmitting ? "Solicitando..." : "Enviar Solicitud"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>

        <CardContent>
          {materialRequests.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay solicitudes de materiales en esta orden
            </p>
          ) : (
            <div className="space-y-3">
              {materialRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{request.material_name}</p>
                        <Badge
                          className={
                            requestStatusColors[request.status] ||
                            "bg-muted text-muted-foreground border-0"
                          }
                        >
                          {requestStatusLabels[request.status] ||
                            request.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Cantidad solicitada: {request.quantity_requested}{" "}
                        {request.material_unit}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Solicitado por: {request.requested_by_name}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Fecha:{" "}
                        {new Date(request.created_at).toLocaleDateString(
                          "es-DO",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    {isAdmin && canEdit && request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer disabled:cursor-not-allowed"
                          onClick={() => handleApprove(request.id)}
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
                          onClick={() => openRejectDialog(request.id)}
                          disabled={processingRequestId === request.id}
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium">Justificación</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {request.justification}
                    </p>
                  </div>

                  {request.status === "rejected" &&
                    request.rejection_reason && (
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Motivo de rechazo
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {request.rejection_reason}
                        </p>
                      </div>
                    )}

                  {(request.status === "approved" ||
                    request.status === "rejected") &&
                    request.reviewed_at && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Revisado por{" "}
                          {request.reviewed_by_name || "Administrador"} el{" "}
                          {new Date(request.reviewed_at).toLocaleDateString(
                            "es-DO",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                Agregar Material
              </CardTitle>
              <CardDescription>
                Como administrador, puedes registrar materiales directamente en
                esta orden
              </CardDescription>
            </div>

            {canEdit && availableMaterials.length > 0 && (
              <Dialog
                open={directAddOpen}
                onOpenChange={(value) => {
                  setDirectAddOpen(value);
                  if (!value) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="cursor-pointer">
                    <Plus className="mr-2 size-4" />
                    Agregar Material
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Material</DialogTitle>
                    <DialogDescription>
                      Seleccione un material y la cantidad a registrar en la
                      orden
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Select
                        value={selectedMaterial}
                        onValueChange={setSelectedMaterial}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar material" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMaterials.map((material) => (
                            <SelectItem
                              key={material.id}
                              value={material.id.toString()}
                            >
                              {material.name} ({material.quantity_in_stock}{" "}
                              {material.unit} disponibles)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Cantidad{" "}
                        {selectedMaterialData &&
                          `(${selectedMaterialData.unit})`}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max={selectedMaterialData?.quantity_in_stock || 999999}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                      {selectedMaterialData && (
                        <p className="text-xs text-muted-foreground">
                          Máximo disponible:{" "}
                          {selectedMaterialData.quantity_in_stock}{" "}
                          {selectedMaterialData.unit}
                        </p>
                      )}
                    </div>

                    <Button
                      className="cursor-pointer"
                      onClick={handleDirectAddSubmit}
                      disabled={!selectedMaterial || !quantity || isSubmitting}
                    >
                      {isSubmitting ? "Agregando..." : "Agregar Material"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              El material agregado por el administrador se registra de inmediato
              y descuenta el stock automáticamente.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Materiales Utilizados
          </CardTitle>
          <CardDescription>
            Materiales registrados como consumidos en esta orden
          </CardDescription>
        </CardHeader>

        <CardContent>
          {orderMaterials.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay materiales registrados en esta orden
            </p>
          ) : (
            <div className="space-y-2">
              {orderMaterials.map((material) => (
                <div
                  key={material.order_material_id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{material.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {material.quantity_used} {material.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Registrado:{" "}
                      {new Date(
                        material.created_at ||
                          material.assigned_at ||
                          new Date(),
                      ).toLocaleDateString("es-DO")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Indique el motivo del rechazo para esta solicitud de material
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {rejectError && (
              <p className="text-sm text-destructive">{rejectError}</p>
            )}

            <div className="space-y-2">
              <Label>Motivo de rechazo</Label>
              <Textarea
                placeholder="Explique por qué se está rechazando esta solicitud"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              variant="outline"
              className="cursor-pointer border-red-600 text-red-600 hover:bg-red-50"
              onClick={handleReject}
              disabled={
                !requestToReject ||
                !rejectionReason.trim() ||
                processingRequestId === requestToReject
              }
            >
              {processingRequestId === requestToReject
                ? "Rechazando..."
                : "Confirmar Rechazo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
