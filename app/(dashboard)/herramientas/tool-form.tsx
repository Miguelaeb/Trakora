"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";

import { createToolAction, updateToolAction } from "./actions";
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

interface Tool {
  id: number;
  name: string;
  internal_code: string | null;
  category: string | null;
  notes: string | null;
  status: "available" | "maintenance" | "lost" | "in_use";
}

interface ToolFormProps {
  tool?: Tool;
}

export function ToolForm({ tool }: ToolFormProps) {
  const action = tool ? updateToolAction : createToolAction;
  const [state, formAction, isPending] = useActionState(action, null);

  const defaultStatus =
    tool?.status && ["available", "maintenance", "lost"].includes(tool.status)
      ? tool.status
      : "available";

  return (
    <form action={formAction} className="space-y-6">
      {tool && <input type="hidden" name="id" value={tool.id} />}

      {state?.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={tool?.name ?? ""}
            placeholder="Taladro inalámbrico"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="internal_code">Código Interno</Label>
          <Input
            id="internal_code"
            name="internal_code"
            defaultValue={tool?.internal_code ?? ""}
            placeholder="HR-001"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            name="category"
            defaultValue={tool?.category ?? ""}
            placeholder="Eléctrica"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            name="status"
            defaultValue={defaultStatus}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="lost">Pérdida</SelectItem>
            </SelectContent>
          </Select>

          {tool?.status === "in_use" && (
            <p className="text-xs text-muted-foreground">
              Esta herramienta está en uso. Ese estado se gestiona
              automáticamente desde las órdenes y solicitudes.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={tool?.notes ?? ""}
          placeholder="Notas de la herramienta..."
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : tool
              ? "Actualizar Herramienta"
              : "Crear Herramienta"}
        </Button>
      </div>
    </form>
  );
}
