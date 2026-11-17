import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "../db";
import { users } from "../db/schema";

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<string> {
  // Cek apakah email sudah terdaftar
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("email sudah terdaftar");
  }

  // Hash password dengan bcrypt (salt rounds 10)
  const hashedPassword = await hash(password, 10);

  // Insert user baru
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return "ok";
}
