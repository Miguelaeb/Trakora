import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { MaterialForm } from "../material-form"

export const metadata = {
  title: "Nuevo Material - Trakora",
}

export default async function NuevoMaterialPage() {
  try {
    await requireAdmin()
  } catch {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/materiales">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Material</h1>
          <p className="text-muted-foreground">Registra un nuevo material en el inventario</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Material</CardTitle>
          <CardDescription>Complete los datos del material</CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialForm />
        </CardContent>
      </Card>
    </div>
  )
}
