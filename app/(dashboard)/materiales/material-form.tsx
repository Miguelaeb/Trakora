"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { createMaterialAction, updateMaterialAction } from "./actions";

interface Material {
  id: number;
  name: string;
  category: string | null;
  unit: string;
  quantity_in_stock: number;
  min_stock_level: number;
}

interface MaterialFormProps {
  material?: Material;
}

export function MaterialForm({ material }: MaterialFormProps) {
  const action = material ? updateMaterialAction : createMaterialAction;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {material && <input type="hidden" name="id" value={material.id} />}

      {state?.error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
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
            defaultValue={material?.name}
            placeholder="Cable eléctrico"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unidad de Medida *</Label>
          <Input
            id="unit"
            name="unit"
            defaultValue={material?.unit}
            placeholder="metros, unidades, kg, etc."
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Input
          id="category"
          name="category"
          defaultValue={material?.category || ""}
          placeholder="Eléctrico, Limpieza, Redes..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantity_in_stock">Stock Actual</Label>
          <Input
            id="quantity_in_stock"
            name="quantity_in_stock"
            type="number"
            min="0"
            defaultValue={material?.quantity_in_stock || 0}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_stock_level">Stock Mínimo</Label>
          <Input
            id="min_stock_level"
            name="min_stock_level"
            type="number"
            min="0"
            defaultValue={material?.min_stock_level || 0}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            Se mostrará una alerta cuando el stock esté por debajo de este nivel
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : material
              ? "Actualizar Material"
              : "Crear Material"}
        </Button>
      </div>
    </form>
  );
}
