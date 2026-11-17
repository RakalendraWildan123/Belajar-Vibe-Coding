# Feature: API Logout User (DELETE /api/users/logout)

## 📌 Ringkasan

Implementasi endpoint API `DELETE /api/users/logout` untuk menghapus sesi login user dari database berdasarkan token autentikasi (Bearer token). Setelah logout berhasil, session token tersebut dihapus dari tabel `sessions` sehingga tidak dapat digunakan kembali untuk mengakses resource yang terproteksi.

Dokumen ini disusun sebagai panduan implementasi step-by-step bagi junior programmer atau model AI untuk mengeksekusi fitur ini.

---

## 📐 Spesifikasi API

### Endpoint

```http
DELETE /api/users/logout
```

### Request Headers

| Header | Nilai / Format | Keterangan |
|---|---|---|
| `Authorization` | `Bearer <token>` | Token UUID sesi login yang aktif (dari tabel `sessions`) |

> **Catatan Alur Token:** Token didapatkan saat login (`POST /api/users/login`) dan tersimpan di tabel `sessions`. Saat logout, record sesi dengan token ini harus dihapus dari tabel `sessions`.

### Response Body (Sukses - Status 200 OK)

Ketika sesi dengan token tersebut berhasil ditemukan dan dihapus dari database:

```json
{
  "data": "ok"
}
```

### Response Body (Error - Status 401 Unauthorized)

Jika header `Authorization` tidak disertakan, formatnya salah (bukan `Bearer <token>`), token kosong, atau token tidak ditemukan di tabel `sessions`:

```json
{
  "error": "Unauthorized"
}
```

---

## 📁 File yang Perlu Diubah

Tidak ada penambahan tabel atau file baru. Implementasi dilakukan pada file yang sudah ada:

```text
src/
├── db/
│   ├── index.ts          # (sudah ada) Koneksi database Drizzle
│   └── schema.ts         # (sudah ada) Schema tabel users & sessions
├── routes/
│   └── users-route.ts    # (update) Tambahkan method DELETE /api/users/logout
└── services/
    └── user-service.ts   # (update) Tambahkan fungsi logoutUser
```

---

## 🔧 Tahapan Implementasi

### Tahap 1: Tambahkan Logic Bisnis di Service Layer (`src/services/user-service.ts`)

Buka file `src/services/user-service.ts`. Tambahkan fungsi `logoutUser` di bagian bawah file.

#### Alur Logic Fungsi `logoutUser(token: string): Promise<string>`:
1. Validasi parameter `token`. Jika string kosong atau falsy → throw error `"Unauthorized"`.
2. Cari apakah token tersebut ada di tabel `sessions` menggunakan query Drizzle ORM:
   ```typescript
   const [session] = await db
     .select({ id: sessions.id })
     .from(sessions)
     .where(eq(sessions.token, token))
     .limit(1);
   ```
3. Jika record sesi **tidak ditemukan** → throw error `"Unauthorized"`.
4. Jika record sesi ditemukan, hapus record tersebut dari tabel `sessions`:
   ```typescript
   await db.delete(sessions).where(eq(sessions.token, token));
   ```
5. Kembalikan string `"ok"`.

---

### Tahap 2: Tambahkan Endpoint di Route Layer (`src/routes/users-route.ts`)

Buka file `src/routes/users-route.ts`. Tambahkan endpoint `DELETE` pada chain instance `usersRoute`.

#### Alur Endpoint `DELETE /api/users/logout`:
1. Import fungsi `logoutUser` dari `../services/user-service`.
2. Daftarkan method `.delete("/api/users/logout", async ({ headers, set }) => { ... })`.
3. Ambil header `Authorization` dari `headers["authorization"]`.
4. Validasi format header:
   - Pastikan header ada dan diawali string `"Bearer "`.
   - Ekstrak token dengan `authHeader.slice(7).trim()`.
   - Jika header tidak ada, format salah, atau token kosong:
     - Set status HTTP 401 (`set.status = 401`).
     - Return `{ error: "Unauthorized" }`.
5. Panggil `await logoutUser(token)` di dalam blok `try...catch`:
   - **Jika berhasil:**
     - Set `set.status = 200`.
     - Return `{ data: "ok" }`.
   - **Jika terjadi error:**
     - Set `set.status = 401`.
     - Return `{ error: "Unauthorized" }`.

---

### Tahap 3: Verifikasi Type Checking & Testing

#### 1. Type Check
Jalankan type checking Bun untuk memastikan tidak ada kesalahan TypeScript:
```bash
bun check
```

#### 2. Manual Testing dengan cURL

**A. Test Unauthorized (Tanpa Header Authorization):**
```bash
curl -i -X DELETE http://localhost:3000/api/users/logout
```
*Ekspektasi Status:* `401 Unauthorized`  
*Ekspektasi Body:* `{"error":"Unauthorized"}`

**B. Test Unauthorized (Token Tidak Valid / Sudah Terhapus):**
```bash
curl -i -X DELETE http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer token-tidak-ada-12345"
```
*Ekspektasi Status:* `401 Unauthorized`  
*Ekspektasi Body:* `{"error":"Unauthorized"}`

**C. Test Skenario Lengkap (Login -> Cek Profil -> Logout -> Cek Profil Lagi):**
1. **Login user untuk mendapatkan token:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"raka@localhost","password":"rahasia"}'
```
*(Salin token UUID dari respons)*

2. **Logout dengan token tersebut:**
```bash
curl -i -X DELETE http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer <token-yang-didapat>"
```
*Ekspektasi Status:* `200 OK`  
*Ekspektasi Body:* `{"data":"ok"}`

3. **Verifikasi token sudah tidak bisa dipakai lagi (Cek current user):**
```bash
curl -i -X GET http://localhost:3000/api/users/current \
  -H "Authorization: Bearer <token-yang-didapat>"
```
*Ekspektasi Status:* `401 Unauthorized`  
*Ekspektasi Body:* `{"error":"Unauthorized"}`

---

## ✅ Definition of Done (DoD)

- [x] Fungsi `logoutUser` dibuat di `src/services/user-service.ts`.
- [x] Endpoint `DELETE /api/users/logout` ditambahkan di `src/routes/users-route.ts`.
- [x] Header `Authorization: Bearer <token>` divalidasi dengan benar.
- [x] Request tanpa header atau dengan format header salah mengembalikan status `401` dan `{ "error": "Unauthorized" }`.
- [x] Request dengan token yang tidak ada di database mengembalikan status `401` dan `{ "error": "Unauthorized" }`.
- [ ] Request dengan token valid menghapus record sesi dari tabel `sessions` dan mengembalikan status `200` serta `{ "data": "ok" }`. *(perlu MySQL aktif)*
- [ ] Token yang sudah di-logout tidak dapat digunakan kembali untuk memanggil endpoint terproteksi (`GET /api/users/current`). *(perlu MySQL aktif)*
- [x] Type check (`bun check`) bebas dari error.
