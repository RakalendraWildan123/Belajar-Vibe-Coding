# Feature: API Get Current User (GET /api/users/current)

## 📌 Ringkasan

Implementasi endpoint API `GET /api/users/current` untuk mengambil data profil user yang sedang login berdasarkan token autentikasi (Bearer token) yang tersimpan di tabel `sessions`.

Dokumen ini disusun sebagai panduan implementasi step-by-step bagi junior programmer atau model AI untuk mengeksekusi fitur ini.

---

## 📐 Spesifikasi API

### Endpoint

```http
GET /api/users/current
```

### Request Headers

| Header | Nilai / Format | Keterangan |
|---|---|---|
| `Authorization` | `Bearer <token>` | Token UUID sesi login yang valid (dari tabel `sessions`) |

> **Catatan Alur Token:** Token didapatkan saat user login (`POST /api/users/login`) dan tersimpan di tabel `sessions`. Token ini memiliki relasi foreign key `user_id` ke tabel `users`.

### Response Body (Sukses - Status 200 OK)

Mengembalikan data profil user **tanpa** field `password`:

```json
{
  "data": {
    "id": 1,
    "name": "raka",
    "email": "raka@localhost",
    "created_at": "2026-11-17T10:00:00.000Z"
  }
}
```

### Response Body (Error - Status 401 Unauthorized)

Jika header `Authorization` tidak ada, format salah (bukan `Bearer <token>`), token tidak ditemukan di tabel `sessions`, atau user tidak ditemukan:

```json
{
  "error": "Unauthorized"
}
```

---

## 📁 File yang Perlu Diubah

Tidak ada penambahan file atau tabel baru. Seluruh schema dan routing sudah tersedia:

```text
src/
├── db/
│   ├── index.ts          # (sudah ada) Koneksi database Drizzle
│   └── schema.ts         # (sudah ada) Tabel users & sessions
├── routes/
│   └── users-route.ts    # (update) Tambahkan endpoint GET /api/users/current
└── services/
    └── user-service.ts   # (update) Tambahkan fungsi getCurrentUser
```

---

## 🔧 Tahapan Implementasi

### Tahap 1: Tambahkan Logic Bisnis di Service Layer (`src/services/user-service.ts`)

Buka file `src/services/user-service.ts`. Tambahkan fungsi `getCurrentUser` di bagian bawah file.

#### Alur Logic Fungsi `getCurrentUser(token: string)`:
1. Validasi parameter `token`. Jika kosong atau invalid → throw error `"Unauthorized"`.
2. Cari record sesi di tabel `sessions` menggunakan Drizzle ORM berdasarkan kolom `token`.
3. Jika sesi tidak ditemukan → throw error `"Unauthorized"`.
4. Ambil data user dari tabel `users` berdasarkan `userId` dari sesi tersebut.
   - Pilih kolom: `id`, `name`, `email`, `createdAt`.
   - **PENTING:** Jangan pernah menyertakan kolom `password` dalam query/return.
5. Jika user tidak ditemukan → throw error `"Unauthorized"`.
6. Kembalikan data user object (`{ id, name, email, created_at: user.createdAt }`).

*(Tips: Bisa menggunakan query terpisah atau menggunakan query `innerJoin` antara tabel `sessions` dan `users` untuk efisiensi).*

---

### Tahap 2: Tambahkan Endpoint di Route Layer (`src/routes/users-route.ts`)

Buka file `src/routes/users-route.ts`. Sambungkan endpoint baru ke chain instance `usersRoute`.

#### Alur Endpoint `GET /api/users/current`:
1. Import fungsi `getCurrentUser` dari `../services/user-service`.
2. Daftarkan method `.get("/api/users/current", async ({ headers, set }) => { ... })`.
3. Ambil header `Authorization` dari `headers["authorization"]` (case-insensitive di Elysia).
4. Validasi header `Authorization`:
   - Pastikan header ada dan diawali dengan prefix `"Bearer "`.
   - Ekstrak token dengan memisahkan string: `const token = authHeader.split(" ")[1]` (atau `authHeader.slice(7)`).
   - Jika format salah atau token kosong → set `set.status = 401` dan return `{ error: "Unauthorized" }`.
5. Panggil fungsi `getCurrentUser(token)`.
6. Jika berhasil:
   - Set status HTTP 200 (default).
   - Return `{ data: user }`.
7. Jika terjadi error:
   - Tangkap di blok `catch`.
   - Set `set.status = 401`.
   - Return `{ error: "Unauthorized" }`.

---

### Tahap 3: Verifikasi Type Checking & Testing

#### 1. Type Check
Jalankan pemeriksaan TypeScript untuk memastikan tidak ada kesalahan tipe:
```bash
bun check
```

#### 2. Manual Testing dengan cURL

**A. Test Unauthorized (Tanpa Header Authorization):**
```bash
curl -i -X GET http://localhost:3000/api/users/current
```
*Ekspektasi Status:* `401 Unauthorized`  
*Ekspektasi Body:* `{"error":"Unauthorized"}`

**B. Test Unauthorized (Token Palsu / Tidak Valid):**
```bash
curl -i -X GET http://localhost:3000/api/users/current \
  -H "Authorization: Bearer token-ngawur-12345"
```
*Ekspektasi Status:* `401 Unauthorized`  
*Ekspektasi Body:* `{"error":"Unauthorized"}`

**C. Test Sukses (Menggunakan Token Hasil Login):**
1. Login terlebih dahulu untuk mendapatkan token:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"raka@localhost","password":"rahasia"}'
```
*(Salin token UUID dari response `{"data":"<token>"}`)*

2. Panggil endpoint current user dengan token tersebut:
```bash
curl -i -X GET http://localhost:3000/api/users/current \
  -H "Authorization: Bearer <token-yang-didapat>"
```
*Ekspektasi Status:* `200 OK`  
*Ekspektasi Body:*
```json
{
  "data": {
    "id": 1,
    "name": "raka",
    "email": "raka@localhost",
    "created_at": "2026-11-17T10:00:00.000Z"
  }
}
```

---

## ✅ Definition of Done (DoD)

- [x] Fungsi `getCurrentUser` dibuat di `src/services/user-service.ts`.
- [x] Endpoint `GET /api/users/current` ditambahkan di `src/routes/users-route.ts`.
- [x] Header `Authorization: Bearer <token>` diparsing dan divalidasi dengan aman.
- [x] Request tanpa token atau dengan token tidak valid mengembalikan status `401` dan `{ "error": "Unauthorized" }`.
- [ ] Request dengan token valid mengembalikan status `200` dan data user sesuai format. *(perlu MySQL aktif)*
- [x] Field sensitif seperti `password` tidak bocor di response body.
- [x] Pemeriksaan tipe (`bun check`) bebas dari error.
