"use server"

import { login, deleteSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function loginAction(
  prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectTo = formData.get("redirect") as string | null

  if (!email || !password) {
    return { error: "Por favor ingrese email y contraseña" }
  }

  const result = await login(email, password)

  if (!result.success) {
    return { error: result.error }
  }

  redirect(redirectTo || "/dashboard")
}

export async function logoutAction(): Promise<void> {
  await deleteSession()
  redirect("/login")
}
