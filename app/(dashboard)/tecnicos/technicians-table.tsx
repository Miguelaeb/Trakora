"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Trash2,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";
import {
  deleteTechnicianAction,
  toggleTechnicianStatusAction,
} from "./actions";

interface Technician {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  active: boolean;
  created_at: string;
  active_orders: number | string;
}

interface TechniciansTableProps {
  technicians: Technician[];
}

export function TechniciansTable({ technicians }: TechniciansTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const selectedTechnician = useMemo(
    () => technicians.find((tech) => tech.id === deleteId) ?? null,
    [deleteId, technicians],
  );

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      const formData = new FormData();
      formData.set("id", deleteId.toString());

      const result = await deleteTechnicianAction(formData);

      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Ocurrió un error al intentar eliminar el técnico.");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async (id: number, currentActive: boolean) => {
    try {
      setUpdatingId(id);
      const formData = new FormData();
      formData.set("id", id.toString());
      formData.set("active", currentActive.toString());

      const result = await toggleTechnicianStatusAction(formData);

      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("No se pudo actualizar el estado del técnico.");
    } finally {
      setUpdatingId(null);
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo Electrónico</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Órdenes Activas</TableHead>
                <TableHead className="hidden md:table-cell">
                  Fecha de Registro
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {technicians.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay técnicos registrados
                  </TableCell>
                </TableRow>
              ) : (
                technicians.map((tech) => {
                  const activeOrders = Number(tech.active_orders) || 0;
                  const hasActiveOrders = activeOrders > 0;

                  return (
                    <TableRow key={tech.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{tech.full_name}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">{tech.email}</span>
                      </TableCell>

                      <TableCell>
                        {tech.phone ? (
                          <span className="text-sm">{tech.phone}</span>
                        ) : (
                          <span className="text-muted-foreground">
                            No definido
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {tech.specialty ? (
                          <span className="text-sm">{tech.specialty}</span>
                        ) : (
                          <span className="text-muted-foreground">
                            No definida
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={tech.active ? "default" : "secondary"}>
                          {tech.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {hasActiveOrders ? (
                          <Badge variant="secondary">{activeOrders}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        {new Date(tech.created_at).toLocaleDateString("es-DO")}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={updatingId === tech.id}
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/tecnicos/${tech.id}/editar`}>
                                <Edit className="mr-2 size-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleStatus(tech.id, tech.active)
                              }
                            >
                              {tech.active ? (
                                <>
                                  <UserX className="mr-2 size-4" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 size-4" />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={hasActiveOrders}
                              className="text-destructive focus:text-destructive disabled:opacity-50"
                              onClick={() => setDeleteId(tech.id)}
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
            <AlertDialogTitle>¿Eliminar técnico?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTechnician ? (
                <>
                  Se eliminará permanentemente al técnico{" "}
                  <span className="font-medium text-foreground">
                    {selectedTechnician.full_name}
                  </span>
                  . Esta acción no se puede deshacer.
                </>
              ) : (
                "Esta acción no se puede deshacer. El técnico será eliminado permanentemente del sistema."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground">
              Cancelar
            </AlertDialogCancel>

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
