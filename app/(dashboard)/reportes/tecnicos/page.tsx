import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import { PrintButton } from "../orden/[id]/print-button";

export const metadata = {
  title: "Reporte de Técnicos - Trakora",
};

async function getTechnicians() {
  return sql`
    SELECT 
      u.full_name,
      u.email,
      u.active,
      u.created_at,
      COUNT(so.id) FILTER (WHERE so.status = 'completed') as completadas,
      COUNT(so.id) FILTER (WHERE so.status IN ('pending', 'assigned', 'in_progress')) as activas
    FROM users u
    LEFT JOIN service_orders so ON u.id = so.assigned_to
    WHERE u.role = 'technician'
    GROUP BY u.id, u.full_name, u.email, u.active, u.created_at
    ORDER BY u.full_name
  `;
}

export default async function ReporteTecnicosPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const technicians = await getTechnicians();
  const now = new Date().toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="rounded-lg border bg-background p-8 print:border-0 print:p-0">
        <div className="mb-6 border-b pb-6 text-center">
          <h1 className="text-2xl font-bold">TRAKORA</h1>
          <p className="text-muted-foreground">Reporte de Técnicos</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Generado el {now}
          </p>
        </div>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="border p-2 text-left">Nombre</th>
              <th className="border p-2 text-left">Correo</th>
              <th className="border p-2 text-left">Estado</th>
              <th className="border p-2 text-center">Órdenes Activas</th>
              <th className="border p-2 text-center">Órdenes Completadas</th>
              <th className="border p-2 text-left">Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            {technicians.map((tech, i) => (
              <tr key={i}>
                <td className="border p-2 font-medium">{tech.full_name}</td>
                <td className="border p-2">{tech.email}</td>
                <td className="border p-2">
                  {tech.active ? "Activo" : "Inactivo"}
                </td>
                <td className="border p-2 text-center">{tech.activas}</td>
                <td className="border p-2 text-center">{tech.completadas}</td>
                <td className="border p-2">
                  {new Date(tech.created_at).toLocaleDateString("es-DO")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-4 text-sm text-muted-foreground">
          Total: {technicians.length} técnicos
        </p>
      </div>
    </div>
  );
}
