"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";
import { createTechnicianAction, updateTechnicianAction } from "./actions";

interface Technician {
  id: number;
  full_name?: string;
  name?: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  active: boolean;
}

interface TechnicianFormProps {
  technician?: Technician;
}

export function TechnicianForm({ technician }: TechnicianFormProps) {
  const action = technician ? updateTechnicianAction : createTechnicianAction;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {technician && <input type="hidden" name="id" value={technician.id} />}

      {state?.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Completo *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={technician?.full_name || technician?.name || ""}
            placeholder="Juan Pérez"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={technician?.email || ""}
            placeholder="juan@trakora.com"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={technician?.phone || ""}
            placeholder="809-555-1234"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialty">Especialidad</Label>
          <Input
            id="specialty"
            name="specialty"
            defaultValue={technician?.specialty || ""}
            placeholder="Climatización"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">
            {technician ? "Nueva Contraseña (opcional)" : "Contraseña *"}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required={!technician}
            minLength={6}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">
            {technician
              ? "Confirmar Nueva Contraseña"
              : "Confirmar Contraseña *"}
          </Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            placeholder="••••••••"
            required={!technician}
            minLength={6}
            disabled={isPending}
          />
        </div>
      </div>

      {technician && (
        <div className="flex items-center gap-3">
          <Switch
            id="active"
            name="active"
            value="true"
            defaultChecked={technician.active}
            disabled={isPending}
          />
          <Label htmlFor="active">Técnico Activo</Label>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : technician
              ? "Actualizar Técnico"
              : "Crear Técnico"}
        </Button>
      </div>
    </form>
  );
}
