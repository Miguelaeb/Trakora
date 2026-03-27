import { requireAdmin } from "@/lib/auth"
import { sql } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Wrench, Package, Users, ClipboardList } from "lucide-react"

export const metadata = {
  title: "Reportes - Trakora",
}

async function getStats() {
  const [orders, tools, materials, technicians] = await Promise.all([
    sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completada') as completadas,
        COUNT(*) FILTER (WHERE status = 'pendiente' OR status = 'en_progreso') as activas
      FROM service_orders
    `,
    sql`SELECT COUNT(*) as total FROM tools`,
    sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE quantity_in_stock <= min_stock_level) as bajo_stock
      FROM materials
    `,
    sql`SELECT COUNT(*) as total FROM users WHERE role = 'tecnico' AND active = true`,
  ])

  return {
    orders: orders[0],
    tools: tools[0],
    materials: materials[0],
    technicians: technicians[0],
  }
}

export default async function ReportesPage() {
  try {
    await requireAdmin()
  } catch {
    redirect("/dashboard")
  }

  const stats = await getStats()

  const reports = [
    {
      title: "Órdenes de Servicio",
      description: `${stats.orders.total} órdenes totales, ${stats.orders.activas} activas`,
      icon: ClipboardList,
      href: "/reportes/ordenes",
    },
    {
      title: "Técnicos",
      description: `${stats.technicians.total} técnicos activos`,
      icon: Users,
      href: "/reportes/tecnicos",
    },
    {
      title: "Herramientas",
      description: `${stats.tools.total} herramientas registradas`,
      icon: Wrench,
      href: "/reportes/herramientas",
    },
    {
      title: "Materiales",
      description: `${stats.materials.total} materiales, ${stats.materials.bajo_stock} con stock bajo`,
      icon: Package,
      href: "/reportes/materiales",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">Genera reportes imprimibles del sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.href}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <report.icon className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={report.href}>
                  <FileText className="mr-2 size-4" />
                  Ver Reporte
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
