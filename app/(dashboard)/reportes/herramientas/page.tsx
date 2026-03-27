import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import { PrintButton } from "../orden/[id]/print-button";

export const metadata = {
  title: "Reporte de Herramientas - Trakora",
};

const statusLabels: Record<string, string> = {
  available: "Disponible",
  in_use: "En uso",
  maintenance: "Mantenimiento",
  lost: "Pérdida",
};

async function getTools() {
  return sql`
    SELECT
      t.name,
      t.internal_code,
      t.category,
      t.notes,
      t.status
    FROM tools t
    ORDER BY t.status, t.name
  `;
}

export default async function ReporteHerramientasPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const tools = await getTools();
  const now = new Date().toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-end mb-4 print:hidden">
        <PrintButton />
      </div>

      <div className="bg-background border rounded-lg p-8 print:border-0 print:p-0">
        <div className="text-center border-b pb-6 mb-6">
          <h1 className="text-2xl font-bold">TRAKORA</h1>
          <p className="text-muted-foreground">Reporte de Herramientas</p>
          <p className="text-sm text-muted-foreground mt-2">
            Generado el {now}
          </p>
        </div>

        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 border">Nombre</th>
              <th className="text-left p-2 border">Código Interno</th>
              <th className="text-left p-2 border">Categoría</th>
              <th className="text-left p-2 border">Notas</th>
              <th className="text-left p-2 border">Estado</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool, i) => (
              <tr key={i}>
                <td className="p-2 border font-medium">{tool.name}</td>
                <td className="p-2 border">{tool.internal_code || "-"}</td>
                <td className="p-2 border">{tool.category || "-"}</td>
                <td className="p-2 border">{tool.notes || "-"}</td>
                <td className="p-2 border">
                  {statusLabels[tool.status] || tool.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-sm text-muted-foreground mt-4">
          Total: {tools.length} herramientas
        </p>
      </div>
    </div>
  );
}
