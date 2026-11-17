# Feature: Inisialisasi Project Backend (Bun + ElysiaJS + Drizzle ORM + MySQL)

## 📌 Ringkasan
Inisialisasi project backend baru pada direktori ini menggunakan runtime **Bun**, framework **ElysiaJS**, dan ORM **Drizzle** yang terhubung ke database **MySQL**.

Dokumen ini berfungsi sebagai panduan implementasi tingkat tinggi (high-level) bagi pengembang atau model LLM untuk mengeksekusi setup awal project.

---

## 🎯 Scope of Work (Langkah Kerja High-Level)

### 1. Inisialisasi Project & Konfigurasi Dasar
- Inisialisasi project baru menggunakan **Bun** di root folder ini.
- Konfigurasi TypeScript (`tsconfig.json`) yang sesuai dengan standar Bun dan Elysia.
- Setup file konfigurasi environment:
  - Buat `.env.example` sebagai template (berisi variabel koneksi database `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, dan `PORT` server).
  - Pastikan `.env` dan `node_modules` masuk ke dalam `.gitignore`.

### 2. Instalasi Dependensi
- **Runtime & Web Framework:**
  - `elysia` (ElysiaJS)
- **Database & ORM:**
  - `drizzle-orm`
  - Driver database MySQL (misal: `mysql2`)
- **Development Tools:**
  - `drizzle-kit` (untuk migrasi dan schema management)
  - Type definitions yang diperlukan (seperti `@types/bun`)

### 3. Setup Konfigurasi Database (Drizzle ORM & MySQL)
- Buat file konfigurasi Drizzle (`drizzle.config.ts`) dengan dialek `mysql`.
- Buat modul koneksi database menggunakan driver MySQL dan instance Drizzle ORM.
- Siapkan struktur folder schema database (misal: `src/db/schema/` atau `src/db/schema.ts`).
- Daftarkan skrip pendukung di `package.json` untuk manajemen database:
  - `db:generate` (generate migration files)
  - `db:migrate` / `db:push` (eksekusi migrasi ke MySQL)
  - `db:studio` (opsional: Drizzle Studio UI)

### 4. Setup Struktur Aplikasi & Entry Point
- Buat entry point server (misal: `src/index.ts`).
- Inisialisasi instance aplikasi ElysiaJS.
- Buat endpoint dasar (health check), misalnya:
  - `GET /` atau `GET /health` untuk memverifikasi bahwa server berjalan dan koneksi database aktif.
- Konfigurasikan skrip `start` dan `dev` (menggunakan watch mode Bun) di `package.json`.

---

## ✅ Definition of Done (DoD)
- [x] Project berhasil diinisialisasi dengan struktur folder yang rapi dan terorganisir.
- [x] Seluruh dependensi utama (`elysia`, `drizzle-orm`, `mysql2`, `drizzle-kit`) terpasang tanpa konflik.
- [x] Konfigurasi Drizzle ORM siap pakai dan terhubung dengan konfigurasi MySQL.
- [x] Server Elysia dapat dijalankan menggunakan perintah Bun (`bun run dev`).
- [x] Endpoint health check merespons dengan status sukses (200 OK).
- [x] Disediakan dokumentasi singkat (README atau catatan) mengenai cara mengisi `.env` dan menjalankan project.
