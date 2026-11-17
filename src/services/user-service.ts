import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { db } from "../db";
import { sessions, users } from "../db/schema";

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

export async function loginUser(
  email: string,
  password: string
): Promise<string> {
  // Cari user berdasarkan email
  const [user] = await db
    .select({ id: users.id, password: users.password })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error("email atau password salah");
  }

  // Verifikasi kecocokan password
  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("email atau password salah");
  }

  // Generate UUID token untuk session
  const token = crypto.randomUUID();

  // Simpan session baru ke database
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
}
