import { Suspense } from "react"
import { LoginForm } from "./login-form"

export const metadata = {
  title: "Iniciar Sesión - Trakora",
  description: "Inicia sesión en el sistema de gestión de órdenes de servicio",
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
