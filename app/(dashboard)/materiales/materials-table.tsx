"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Edit,
  MoreHorizontal,
  Search,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { deleteMaterialAction, adjustStockAction } from "./actions";

interface Material {
  id: number;
  name: string;
  category: string | null;
  unit: string;
  quantity_in_stock: number;
  min_stock_level: number;
}

interface MaterialsTableProps {
  materials: Material[];
}

export function MaterialsTable({ materials }: MaterialsTableProps) {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [adjustStock, setAdjustStock] = useState<{
    id: number;
    name: string;
    type: "add" | "subtract";
  } | null>(null);
  const [adjustment, setAdjustment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredMaterials = materials.filter((material) => {
    const query = search.toLowerCase();

    return (
      material.name.toLowerCase().includes(query) ||
      material.category?.toLowerCase().includes(query)
    );
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    const formData = new FormData();
    formData.set("id", deleteId.toString());
    await deleteMaterialAction(formData);
    setDeleteId(null);
  };

  const handleAdjustStock = async () => {
    if (!adjustStock || !adjustment) return;

    const formData = new FormData();
    formData.set("id", adjustStock.id.toString());
    formData.set("adjustment", adjustment);
    formData.set("type", adjustStock.type);

    const result = await adjustStockAction(formData);
    if (result?.error) {
      setError(result.error);
    }

    setAdjustStock(null);
    setAdjustment("");
  };

  return (
    <>
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Cerrar
          </button>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">
                  Categoría
                </TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Stock Mínimo</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No se encontraron materiales
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => {
                  const lowStock =
                    material.quantity_in_stock <= material.min_stock_level;

                  return (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{material.name}</span>
                          {lowStock && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="size-3" />
                              Stock bajo
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell max-w-xs">
                        <p className="truncate text-muted-foreground">
                          {material.category || "-"}
                        </p>
                      </TableCell>

                      <TableCell>{material.unit}</TableCell>

                      <TableCell>
                        <span
                          className={
                            lowStock ? "font-medium text-destructive" : ""
                          }
                        >
                          {material.quantity_in_stock}
                        </span>
                      </TableCell>

                      <TableCell>{material.min_stock_level}</TableCell>

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
                            <DropdownMenuItem
                              onClick={() =>
                                setAdjustStock({
                                  id: material.id,
                                  name: material.name,
                                  type: "add",
                                })
                              }
                            >
                              <Plus className="mr-2 size-4" />
                              Agregar Stock
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                setAdjustStock({
                                  id: material.id,
                                  name: material.name,
                                  type: "subtract",
                                })
                              }
                            >
                              <Minus className="mr-2 size-4" />
                              Reducir Stock
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link href={`/materiales/${material.id}/editar`}>
                                <Edit className="mr-2 size-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(material.id)}
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

      <Dialog
        open={adjustStock !== null}
        onOpenChange={() => setAdjustStock(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustStock?.type === "add" ? "Agregar Stock" : "Reducir Stock"}
            </DialogTitle>
            <DialogDescription>
              {adjustStock?.type === "add" ? "Agregar" : "Reducir"} stock de{" "}
              {adjustStock?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="Ingrese la cantidad"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAdjustStock} disabled={!adjustment}>
                {adjustStock?.type === "add" ? "Agregar" : "Reducir"}
              </Button>
              <Button variant="outline" onClick={() => setAdjustStock(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El material será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
