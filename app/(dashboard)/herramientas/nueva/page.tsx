import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { ToolForm } from "../tool-form"

export const metadata = {
  title: "Nueva Herramienta - Trakora",
}

export default async function NuevaHerramientaPage() {
  try {
    await requireAdmin()
  } catch {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/herramientas">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Herramienta</h1>
          <p className="text-muted-foreground">Registra una nueva herramienta en el inventario</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Herramienta</CardTitle>
          <CardDescription>Complete los datos de la herramienta</CardDescription>
        </CardHeader>
        <CardContent>
          <ToolForm />
        </CardContent>
      </Card>
    </div>
  )
}
