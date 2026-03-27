import { sql, type User } from "./db";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SESSION_COOKIE_NAME = "trakora_session";
const SESSION_DURATION_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return sessionId;
}

export async function getSession(): Promise<{
  user: Omit<User, "password_hash">;
} | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const result = await sql`
    SELECT u.id, u.email, u.full_name, u.role, u.active, u.created_at, u.updated_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ${sessionId}
      AND s.expires_at > NOW()
      AND u.active = true
  `;

  if (result.length === 0) {
    return null;
  }

  return { user: result[0] as Omit<User, "password_hash"> };
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  console.log("LOGIN EMAIL RAW:", email);
  console.log("LOGIN EMAIL NORMALIZED:", normalizedEmail);

  const result = await sql`
    SELECT id, email, password_hash, active
    FROM users
    WHERE email = ${normalizedEmail}
  `;

  console.log("LOGIN USER RESULT:", result);

  if (result.length === 0) {
    console.log("LOGIN FAIL: usuario no encontrado");
    return { success: false, error: "Credenciales inválidas" };
  }

  const user = result[0];

  if (!user.active) {
    console.log("LOGIN FAIL: usuario desactivado");
    return { success: false, error: "Usuario desactivado" };
  }

  const passwordValid = await verifyPassword(password, user.password_hash);

  console.log("LOGIN PASSWORD VALID:", passwordValid);

  if (!passwordValid) {
    console.log("LOGIN FAIL: contraseña incorrecta");
    return { success: false, error: "Credenciales inválidas" };
  }

  await createSession(user.id);

  console.log("LOGIN SUCCESS");

  return { success: true };
}

export async function requireAuth(): Promise<Omit<User, "password_hash">> {
  const session = await getSession();

  if (!session) {
    throw new Error("No autorizado");
  }

  return session.user;
}

export async function requireAdmin(): Promise<Omit<User, "password_hash">> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new Error("Acceso denegado");
  }

  return user;
}
