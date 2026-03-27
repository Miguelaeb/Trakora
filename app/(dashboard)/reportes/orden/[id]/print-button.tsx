"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <Printer className="mr-2 size-4" />
      Imprimir
    </Button>
  )
}
