import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { redirect } from "next/navigation";
import { PrintButton } from "../orden/[id]/print-button";

export const metadata = {
  title: "Reporte de Materiales - Trakora",
};

async function getMaterials() {
  return sql`
    SELECT name, category, unit, quantity_in_stock, min_stock_level
    FROM materials
    ORDER BY 
      CASE WHEN quantity_in_stock <= min_stock_level THEN 0 ELSE 1 END,
      name
  `;
}

export default async function ReporteMaterialesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const materials = await getMaterials();
  const now = new Date().toLocaleDateString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-end mb-4 print:hidden">
        <PrintButton />
      </div>

      <div className="bg-background border rounded-lg p-8 print:border-0 print:p-0">
        <div className="text-center border-b pb-6 mb-6">
          <h1 className="text-2xl font-bold">TRAKORA</h1>
          <p className="text-muted-foreground">Reporte de Materiales</p>
          <p className="text-sm text-muted-foreground mt-2">
            Generado el {now}
          </p>
        </div>

        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 border">Nombre</th>
              <th className="text-left p-2 border">Categoría</th>
              <th className="text-left p-2 border">Unidad</th>
              <th className="text-center p-2 border">Stock Actual</th>
              <th className="text-center p-2 border">Stock Mínimo</th>
              <th className="text-left p-2 border">Estado</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, i) => {
              const lowStock =
                material.quantity_in_stock <= material.min_stock_level;

              return (
                <tr key={i} className={lowStock ? "bg-red-50" : ""}>
                  <td className="p-2 border font-medium">{material.name}</td>
                  <td className="p-2 border">{material.category || "-"}</td>
                  <td className="p-2 border">{material.unit}</td>
                  <td
                    className={`p-2 border text-center ${
                      lowStock ? "text-red-600 font-medium" : ""
                    }`}
                  >
                    {material.quantity_in_stock}
                  </td>
                  <td className="p-2 border text-center">
                    {material.min_stock_level}
                  </td>
                  <td className="p-2 border">
                    {lowStock ? "Stock Bajo" : "Normal"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="text-sm text-muted-foreground mt-4">
          Total: {materials.length} materiales
        </p>
      </div>
    </div>
  );
}
