# Feature: API Registrasi User Baru

## 📌 Ringkasan

Implementasi endpoint API untuk registrasi user baru dengan hashing password menggunakan bcrypt. Fitur ini mencakup pembuatan tabel `users`, service layer, dan routing.

---

## 📐 Spesifikasi

### Tabel `users` (Update Schema Drizzle)

| Kolom        | Tipe                | Constraint                      |
|-------------|---------------------|---------------------------------|
| `id`        | INT                 | Primary Key, Auto Increment     |
| `name`      | VARCHAR(255)        | NOT NULL                        |
| `email`     | VARCHAR(255)        | NOT NULL, UNIQUE                |
| `password`  | VARCHAR(255)        | NOT NULL (bcrypt hash)          |
| `created_at`| TIMESTAMP           | DEFAULT CURRENT_TIMESTAMP       |

> **Catatan:** Schema Drizzle yang sudah ada di `src/db/schema.ts` sudah memiliki kolom `id`, `name`, `email`, dan `created_at`. Yang perlu ditambahkan adalah kolom `password`.

### Endpoint

```
POST /api/users
```

### Request Body

```json
{
  "name": "raka",
  "email": "raka@localhost",
  "password": "rahasia"
}
```

### Response Body (Sukses - 201)

```json
{
  "data": "ok"
}
```

### Response Body (Error - 400, email sudah terdaftar)

```json
{
  "error": "email sudah terdaftar"
}
```

---

## 📁 Struktur Folder & File

Tambahkan folder dan file berikut di dalam `src/`:

```text
src/
├── db/
│   ├── index.ts          # (sudah ada) Koneksi database
│   └── schema.ts         # (sudah ada, perlu diupdate) Tambah kolom password
├── routes/
│   └── users-route.ts    # (baru) Routing endpoint POST /api/users
├── services/
│   └── user-service.ts   # (baru) Logic bisnis registrasi user
└── index.ts              # (sudah ada, perlu diupdate) Pasang route baru
```

---

## 🔧 Tahapan Implementasi

### Tahap 1: Install Dependensi `bcryptjs`

Install package `bcryptjs` beserta type definitions-nya untuk hashing password.

```bash
bun add bcryptjs
bun add -d @types/bcryptjs
```

**Kenapa `bcryptjs`?** Package ini adalah implementasi bcrypt murni JavaScript, kompatibel dengan Bun tanpa perlu native build.

---

### Tahap 2: Update Schema Database (`src/db/schema.ts`)

Buka file `src/db/schema.ts` yang sudah ada. Tambahkan kolom `password` ke tabel `users`.

**Yang perlu diubah:**
- Tambahkan kolom `password` bertipe `varchar(255)`, `notNull()`.

**Setelah update, generate & push migrasi:**

```bash
bun run db:generate
bun run db:push
```

---

### Tahap 3: Buat Service Layer (`src/services/user-service.ts`)

Buat file baru `src/services/user-service.ts`. File ini berisi seluruh logic bisnis untuk registrasi user.

**Fungsi yang harus dibuat:**

#### `registerUser(name: string, email: string, password: string)`

Alur logic:
1. Cek apakah `email` sudah ada di tabel `users` menggunakan Drizzle ORM query (gunakan `eq` dari `drizzle-orm`).
2. Jika email sudah ada → **throw error** dengan pesan `"email sudah terdaftar"`.
3. Jika email belum ada:
   - Hash `password` menggunakan `bcryptjs` dengan salt rounds `10`.
   - Insert data user baru (`name`, `email`, `password` yang sudah di-hash) ke tabel `users` menggunakan Drizzle ORM.
   - Return `"ok"`.

**Import yang dibutuhkan:**
- `db` dari `../db`
- `users` dari `../db/schema`
- `eq` dari `drizzle-orm`
- `bcryptjs` (fungsi `hash`)

---

### Tahap 4: Buat Route (`src/routes/users-route.ts`)

Buat file baru `src/routes/users-route.ts`. File ini berisi routing ElysiaJS untuk endpoint user.

**Yang harus dibuat:**

Export sebuah **Elysia instance** (plugin pattern) yang berisi:

#### `POST /api/users`
1. Ambil `name`, `email`, `password` dari request body.
2. Panggil fungsi `registerUser()` dari `user-service.ts`.
3. Jika sukses → return `{ data: "ok" }` dengan status `201`.
4. Jika error (email sudah terdaftar) → return `{ error: error.message }` dengan status `400`.

**Contoh pattern Elysia plugin:**
```typescript
import { Elysia } from "elysia";

export const usersRoute = new Elysia()
  .post("/api/users", async ({ body, set }) => {
    // ... implementasi di sini
  });
```

---

### Tahap 5: Pasang Route ke Server (`src/index.ts`)

Buka file `src/index.ts` yang sudah ada. Hubungkan route baru ke instance Elysia menggunakan `.use()`.

**Yang perlu diubah:**
1. Import `usersRoute` dari `./routes/users-route`.
2. Tambahkan `.use(usersRoute)` pada chain Elysia **sebelum** `.listen()`.

---

### Tahap 6: Testing Manual

Jalankan server:
```bash
bun run dev
```

**Test 1 - Registrasi berhasil:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"raka","email":"raka@localhost","password":"rahasia"}'
```
Expected response: `{"data":"ok"}`

**Test 2 - Email duplikat:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"raka","email":"raka@localhost","password":"rahasia"}'
```
Expected response: `{"error":"email sudah terdaftar"}`

---

## ✅ Definition of Done (DoD)

- [x] Dependensi `bcryptjs` dan `@types/bcryptjs` terinstall.
- [x] Schema `users` di Drizzle sudah memiliki kolom `password` (varchar 255, not null).
- [x] Migrasi database berhasil di-generate.
- [x] File `src/services/user-service.ts` dibuat dengan fungsi `registerUser`.
- [x] File `src/routes/users-route.ts` dibuat dengan endpoint `POST /api/users`.
- [x] Route terpasang di `src/index.ts` via `.use()`.
- [ ] `POST /api/users` mengembalikan `{"data":"ok"}` saat registrasi berhasil. *(perlu MySQL aktif)*
- [ ] `POST /api/users` mengembalikan `{"error":"email sudah terdaftar"}` saat email duplikat. *(perlu MySQL aktif)*
- [ ] Password tersimpan di database dalam bentuk bcrypt hash (bukan plain text). *(perlu MySQL aktif)*
- [x] Type check (`bun check`) tidak ada error.
