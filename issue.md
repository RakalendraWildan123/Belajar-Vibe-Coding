# Feature: API Login User

## 📌 Ringkasan

Implementasi endpoint API untuk login user. Fitur ini mencakup pembuatan tabel `sessions` untuk menyimpan token sesi, service layer untuk logic autentikasi, dan routing endpoint login.

---

## 📐 Spesifikasi

### Tabel `sessions` (Tambah Schema Drizzle Baru)

| Kolom        | Tipe                | Constraint                                |
|-------------|---------------------|-------------------------------------------|
| `id`        | INT                 | Primary Key, Auto Increment               |
| `token`     | VARCHAR(255)        | NOT NULL (berisi UUID sebagai token sesi) |
| `user_id`   | INT                 | Foreign Key → `users.id`                  |
| `created_at`| TIMESTAMP           | DEFAULT CURRENT_TIMESTAMP                 |

### Endpoint

```
POST /api/users/login
```

### Request Body

```json
{
  "email": "raka@localhost",
  "password": "rahasia"
}
```

### Response Body (Sukses - 200)

```json
{
  "data": "uuid-token-string-disini"
}
```

### Response Body (Error - 401)

```json
{
  "error": "email atau password salah"
}
```

---

## 📁 File yang Perlu Diubah / Dibuat

```text
src/
├── db/
│   └── schema.ts            # (update) Tambah tabel sessions dengan FK ke users
├── routes/
│   └── users-route.ts       # (update) Tambah endpoint POST /api/users/login
├── services/
│   └── user-service.ts      # (update) Tambah fungsi loginUser
└── index.ts                 # (tidak perlu diubah, route sudah terpasang)
```

> **Catatan:** Karena `usersRoute` sudah terpasang di `src/index.ts` via `.use()`, kamu **tidak perlu** mengubah file `src/index.ts`. Cukup tambahkan endpoint baru di dalam file `users-route.ts` yang sudah ada.

---

## 🔧 Tahapan Implementasi

### Tahap 1: Update Schema Database (`src/db/schema.ts`)

Buka file `src/db/schema.ts`. Tambahkan tabel `sessions` di bawah tabel `users` yang sudah ada.

**Yang perlu dilakukan:**
1. Tambahkan import `int` dari `drizzle-orm/mysql-core` (untuk kolom `user_id` sebagai foreign key).
2. Buat tabel baru `sessions` dengan kolom:
   - `id`: serial, primary key (sama seperti tabel users).
   - `token`: varchar(255), notNull.
   - `userId`: int("user_id"), notNull. Gunakan `.references(() => users.id)` untuk membuat foreign key ke tabel `users`.
   - `createdAt`: timestamp("created_at"), defaultNow, notNull.
3. Export type `Session` dan `NewSession` menggunakan `$inferSelect` dan `$inferInsert`.

**Setelah update, generate migrasi:**

```bash
bun run db:generate
bun run db:push
```

---

### Tahap 2: Tambah Fungsi Login di Service (`src/services/user-service.ts`)

Buka file `src/services/user-service.ts` yang sudah ada. Tambahkan fungsi baru `loginUser` di bawah fungsi `registerUser`.

**Import tambahan yang dibutuhkan:**
- `compare` dari `bcryptjs` (untuk membandingkan password plain text dengan hash).
- `sessions` dari `../db/schema` (tabel sessions yang baru dibuat).
- `crypto` dari bun/node global (untuk generate UUID, gunakan `crypto.randomUUID()`).

**Fungsi yang harus dibuat:**

#### `loginUser(email: string, password: string): Promise<string>`

Alur logic:
1. Cari user berdasarkan `email` di tabel `users` menggunakan Drizzle ORM query (gunakan `eq` dari `drizzle-orm`). Select kolom `id`, `password`.
2. Jika user **tidak ditemukan** → throw error dengan pesan `"email atau password salah"`.
3. Jika user ditemukan:
   - Bandingkan `password` (dari request) dengan `user.password` (hash dari database) menggunakan `compare` dari bcryptjs.
   - Jika password **tidak cocok** → throw error dengan pesan `"email atau password salah"`.
   - Jika password **cocok**:
     - Generate token menggunakan `crypto.randomUUID()`.
     - Insert record baru ke tabel `sessions` dengan `token` dan `userId` (id user yang ditemukan).
     - Return `token`.

> **Penting:** Gunakan pesan error yang **sama** (`"email atau password salah"`) untuk kedua kasus (email tidak ditemukan dan password salah). Ini untuk mencegah enumerasi user.

---

### Tahap 3: Tambah Endpoint Login di Route (`src/routes/users-route.ts`)

Buka file `src/routes/users-route.ts` yang sudah ada. Tambahkan endpoint baru di dalam chain Elysia yang sudah ada.

**Import tambahan:**
- `loginUser` dari `../services/user-service`.

**Endpoint yang harus ditambahkan:**

#### `POST /api/users/login`

Tambahkan `.post("/api/users/login", ...)` di chain Elysia yang sudah ada (setelah endpoint `/api/users`).

Alur:
1. Ambil `email` dan `password` dari request body.
2. Panggil fungsi `loginUser(email, password)` dari service.
3. Jika sukses → return `{ data: token }` dengan status `200`.
4. Jika error → return `{ error: error.message }` dengan status `401`.

**Contoh pattern menambah endpoint ke Elysia yang sudah ada:**
```typescript
export const usersRoute = new Elysia()
  .post("/api/users", async ({ body, set }) => {
    // ... endpoint registrasi yang sudah ada (JANGAN DIUBAH)
  })
  .post("/api/users/login", async ({ body, set }) => {
    // ... endpoint login baru di sini
  });
```

---

### Tahap 4: Generate Migrasi & Testing Manual

**Generate & push migrasi:**
```bash
bun run db:generate
bun run db:push
```

**Jalankan server:**
```bash
bun run dev
```

**Test 1 - Registrasi user dulu (jika belum ada):**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"raka","email":"raka@localhost","password":"rahasia"}'
```

**Test 2 - Login berhasil:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"raka@localhost","password":"rahasia"}'
```
Expected response: `{"data":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}` (UUID token)

**Test 3 - Login gagal (password salah):**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"raka@localhost","password":"salah"}'
```
Expected response: `{"error":"email atau password salah"}`

**Test 4 - Login gagal (email tidak terdaftar):**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tidak@ada.com","password":"rahasia"}'
```
Expected response: `{"error":"email atau password salah"}`

---

## ✅ Definition of Done (DoD)

- [x] Tabel `sessions` ditambahkan di schema Drizzle dengan FK ke `users.id`.
- [x] Migrasi database berhasil di-generate.
- [x] Fungsi `loginUser` ditambahkan di `src/services/user-service.ts`.
- [x] Endpoint `POST /api/users/login` ditambahkan di `src/routes/users-route.ts`.
- [ ] Login berhasil mengembalikan `{"data":"<uuid-token>"}`. *(perlu MySQL aktif)*
- [ ] Login gagal (email/password salah) mengembalikan `{"error":"email atau password salah"}`. *(perlu MySQL aktif)*
- [ ] Token tersimpan di tabel `sessions` dengan `user_id` yang benar. *(perlu MySQL aktif)*
- [x] Type check (`bun check`) tidak ada error.
