import { requireAdmin } from "@/lib/auth"
import { sql } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MaterialsTable } from "./materials-table"

export const metadata = {
  title: "Materiales - Trakora",
}

async function getMaterials() {
  return sql`
    SELECT * FROM materials
    ORDER BY 
      CASE WHEN quantity_in_stock <= min_stock_level THEN 0 ELSE 1 END,
      name
  `
}

export default async function MaterialesPage() {
  try {
    await requireAdmin()
  } catch {
    redirect("/dashboard")
  }

  const materials = await getMaterials()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materiales</h1>
          <p className="text-muted-foreground">
            Gestiona el inventario de materiales
          </p>
        </div>
        <Button asChild>
          <Link href="/materiales/nuevo">
            <Plus className="mr-2 size-4" />
            Nuevo Material
          </Link>
        </Button>
      </div>

      <MaterialsTable materials={materials} />
    </div>
  )
}
