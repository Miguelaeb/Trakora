"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { createOrderAction, updateOrderAction } from "./actions";

interface Technician {
  id: number;
  full_name: string;
  email: string;
}

interface Order {
  id: number;
  client_name: string;
  client_phone: string | null;
  client_address: string | null;
  description: string;
  status: string;
  priority: string;
  assigned_to: number | null;
  scheduled_date: string | null;
  notes: string | null;
}

interface OrderFormProps {
  technicians: Technician[];
  order?: Order;
}

export function OrderForm({ technicians, order }: OrderFormProps) {
  const action = order ? updateOrderAction : createOrderAction;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {order && <input type="hidden" name="id" value={order.id} />}

      {state?.error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          <AlertCircle className="size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client_name">Nombre del Cliente *</Label>
          <Input
            id="client_name"
            name="client_name"
            defaultValue={order?.client_name}
            placeholder="Juan Pérez"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_phone">Teléfono</Label>
          <Input
            id="client_phone"
            name="client_phone"
            type="tel"
            defaultValue={order?.client_phone || ""}
            placeholder="809-555-1234"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client_address">Dirección</Label>
        <Input
          id="client_address"
          name="client_address"
          defaultValue={order?.client_address || ""}
          placeholder="Calle Principal #123, Santo Domingo"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción del Servicio *</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={order?.description}
          placeholder="Describa el servicio requerido..."
          rows={4}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad *</Label>
          <Select
            name="priority"
            defaultValue={order?.priority || "media"}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {order && (
          <div className="space-y-2">
            <Label htmlFor="status">Estado *</Label>
            <Select
              name="status"
              defaultValue={order.status}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="assigned">Asignada</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="assigned_to">Técnico Asignado</Label>
          <Select
            name="assigned_to"
            defaultValue={order?.assigned_to?.toString() || "unassigned"}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              {technicians.map((tech) => (
                <SelectItem key={tech.id} value={tech.id.toString()}>
                  {tech.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduled_date">Fecha Programada</Label>
          <Input
            id="scheduled_date"
            name="scheduled_date"
            type="date"
            defaultValue={
              order?.scheduled_date
                ? new Date(order.scheduled_date).toISOString().split("T")[0]
                : ""
            }
            disabled={isPending}
          />
        </div>
      </div>

      {order && (
        <div className="space-y-2">
          <Label htmlFor="notes">Notas Adicionales</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={order?.notes || ""}
            placeholder="Observaciones, notas del técnico, etc."
            rows={3}
            disabled={isPending}
          />
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : order
              ? "Actualizar Orden"
              : "Crear Orden"}
        </Button>
      </div>
    </form>
  );
}
