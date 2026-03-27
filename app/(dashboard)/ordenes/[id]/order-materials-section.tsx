"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Package, Plus } from "lucide-react"
import { assignMaterialToOrderAction } from "../actions"

interface OrderMaterial {
  order_material_id: number
  quantity_used: number
  assigned_at: string
  material_id: number
  name: string
  unit: string
}

interface AvailableMaterial {
  id: number
  name: string
  unit: string
  quantity_in_stock: number
}

interface OrderMaterialsSectionProps {
  orderId: number
  orderMaterials: OrderMaterial[]
  availableMaterials: AvailableMaterial[]
  canEdit: boolean
}

export function OrderMaterialsSection({
  orderId,
  orderMaterials,
  availableMaterials,
  canEdit,
}: OrderMaterialsSectionProps) {
  const [open, setOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedMaterialData = availableMaterials.find(
    (m) => m.id.toString() === selectedMaterial
  )

  const handleAssign = async () => {
    if (!selectedMaterial || !quantity) return
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData()
    formData.set("order_id", orderId.toString())
    formData.set("material_id", selectedMaterial)
    formData.set("quantity", quantity)
    
    const result = await assignMaterialToOrderAction(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }
    
    setSelectedMaterial("")
    setQuantity("1")
    setOpen(false)
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Materiales Utilizados
          </CardTitle>
          <CardDescription>
            Materiales consumidos en esta orden de servicio
          </CardDescription>
        </div>
        {canEdit && availableMaterials.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                Agregar Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Material</DialogTitle>
                <DialogDescription>
                  Seleccione un material y la cantidad utilizada
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar material" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name} ({material.quantity_in_stock} {material.unit} disponibles)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad {selectedMaterialData && `(${selectedMaterialData.unit})`}</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedMaterialData?.quantity_in_stock || 999}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  {selectedMaterialData && (
                    <p className="text-xs text-muted-foreground">
                      Máximo disponible: {selectedMaterialData.quantity_in_stock} {selectedMaterialData.unit}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedMaterial || !quantity || isSubmitting}
                >
                  {isSubmitting ? "Agregando..." : "Agregar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {orderMaterials.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
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
                    Registrado: {new Date(material.assigned_at).toLocaleDateString("es-DO")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
