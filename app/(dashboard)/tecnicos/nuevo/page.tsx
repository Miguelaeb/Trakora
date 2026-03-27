import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { TechnicianForm } from "../technician-form"

export const metadata = {
  title: "Nuevo Técnico - Trakora",
}

export default async function NuevoTecnicoPage() {
  try {
    await requireAdmin()
  } catch {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tecnicos">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Técnico</h1>
          <p className="text-muted-foreground">Registra un nuevo técnico en el sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Técnico</CardTitle>
          <CardDescription>Complete los datos del nuevo técnico</CardDescription>
        </CardHeader>
        <CardContent>
          <TechnicianForm />
        </CardContent>
      </Card>
    </div>
  )
}
