import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { db } from "../db";
import { sessions, users } from "../db/schema";

/**
 * Mendaftarkan akun pengguna baru ke dalam sistem.
 *
 * Fungsi ini bertugas untuk:
 * 1. Memvalidasi kelayakan parameter input (memastikan name, email, dan password terisi serta tidak melebihi batas 255 karakter).
 * 2. Memeriksa keunikan email di database untuk mencegah pendaftaran email duplikat.
 * 3. Mengamankan password pengguna dengan melakukan hashing satu arah menggunakan bcrypt (salt rounds: 10).
 * 4. Menyimpan record pengguna baru ke dalam tabel `users` di database.
 *
 * @param name - Nama lengkap pengguna (maksimal 255 karakter).
 * @param email - Alamat email unik pengguna (maksimal 255 karakter).
 * @param password - Password akun pengguna dalam bentuk plain text yang akan di-hash.
 * @returns Promise<string> Mengembalikan string "ok" jika proses registrasi berhasil.
 * @throws Error Jika validasi input gagal atau email sudah terdaftar.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<string> {
  // Validasi input parameter
  if (!name || name.trim().length === 0) {
    throw new Error("nama wajib diisi");
  }

  if (name.length > 255) {
    throw new Error("nama tidak boleh lebih dari 255 karakter");
  }

  if (!email || email.trim().length === 0) {
    throw new Error("email wajib diisi");
  }

  if (email.length > 255) {
    throw new Error("email tidak boleh lebih dari 255 karakter");
  }

  if (!password || password.length === 0) {
    throw new Error("password wajib diisi");
  }

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

/**
 * Mengautentikasi pengguna dan membuat sesi login baru.
 *
 * Fungsi ini bertugas untuk:
 * 1. Mencari pengguna di database berdasarkan alamat email yang diberikan.
 * 2. Memverifikasi kecocokan password plain text dengan hash password yang tersimpan di database menggunakan bcrypt.compare.
 * 3. Menghasilkan token sesi unik berbasis UUID (v4) jika kredensial cocok.
 * 4. Menyimpan token sesi dan relasi user_id ke dalam tabel `sessions` di database.
 *
 * @param email - Alamat email akun pengguna yang akan login.
 * @param password - Password akun pengguna yang akan diverifikasi.
 * @returns Promise<string> Mengembalikan token UUID sesi yang dapat digunakan sebagai Bearer token.
 * @throws Error Mengembalikan "email atau password salah" jika email tidak ditemukan atau password tidak cocok.
 */
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

/**
 * Mengambil informasi profil pengguna yang sedang aktif (terotentikasi).
 *
 * Fungsi ini bertugas untuk:
 * 1. Memvalidasi keberadaan token sesi otentikasi.
 * 2. Melakukan query inner join antara tabel `sessions` dan tabel `users` berdasarkan session token.
 * 3. Memilih field profil publik pengguna (id, name, email, created_at).
 * 4. Menjamin keamanan data pengguna dengan tidak menyertakan field `password` dalam hasil return.
 *
 * @param token - Token UUID sesi aktif yang dikirimkan melalui header Authorization (Bearer token).
 * @returns Promise<object> Objek profil pengguna berisi id, name, email, dan created_at.
 * @throws Error Mengembalikan "Unauthorized" jika token kosong, tidak valid, atau sesi tidak ditemukan.
 */
export async function getCurrentUser(token: string) {
  if (!token) {
    throw new Error("Unauthorized");
  }

  // Ambil data user yang berelasi dengan session token via inner join
  const [result] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      created_at: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (!result) {
    throw new Error("Unauthorized");
  }

  return result;
}

/**
 * Mengakhiri sesi pengguna aktif (logout) dengan mencabut token sesi.
 *
 * Fungsi ini bertugas untuk:
 * 1. Memvalidasi keberadaan token sesi yang ingin diakhiri.
 * 2. Memeriksa apakah token sesi tersebut masih terdaftar aktif di tabel `sessions`.
 * 3. Menghapus record token sesi dari tabel `sessions` agar token tersebut tidak dapat digunakan kembali.
 *
 * @param token - Token UUID sesi aktif yang akan dicabut/dihapus.
 * @returns Promise<string> Mengembalikan string "ok" jika sesi berhasil dihapus.
 * @throws Error Mengembalikan "Unauthorized" jika token kosong atau tidak ditemukan di tabel sessions.
 */
export async function logoutUser(token: string): Promise<string> {
  if (!token) {
    throw new Error("Unauthorized");
  }

  // Cek apakah session ada di database
  const [session] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Hapus session dari database
  await db.delete(sessions).where(eq(sessions.token, token));

  return "ok";
}
