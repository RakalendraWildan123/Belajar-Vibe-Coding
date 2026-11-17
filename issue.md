# Bug: Kurangnya Validasi Panjang Karakter `name` pada Endpoint Registrasi User

## 📌 Deskripsi Masalah

Pada endpoint `POST /api/users`, saat ini belum ada validasi batas panjang karakter untuk field `name` di sisi aplikasi.

Di skema database (`src/db/schema.ts`), kolom `name` didefinisikan sebagai `varchar(255)`:
```typescript
name: varchar("name", { length: 255 }).notNull(),
```

Jika client mengirimkan request registrasi dengan `name` melebihi 255 karakter (misalnya 300 karakter), aplikasi tetap mencoba memasukkan data tersebut ke database MySQL. Hal ini menyebabkan:
1. Database menolak query dan memicu error `ER_DATA_TOO_LONG: Data too long for column 'name' at row 1`.
2. Detail error query database bocor ke client dalam response HTTP 400.
3. Beban query yang sia-sia ke database karena input tidak divalidasi terlebih dahulu di layer routing/service.

---

## 🎯 Perilaku yang Diharapkan (Expected Behavior)

- Request body divalidasi sebelum query ke database dijalankan.
- Jika field `name` memiliki panjang lebih dari 255 karakter (atau kosong):
  - Request langsung ditolak di layer aplikasi.
  - Mengembalikan **HTTP Status 400 (Bad Request)**.
  - Mengembalikan pesan error yang jelas dan user-friendly:
    ```json
    {
      "error": "nama tidak boleh lebih dari 255 karakter"
    }
    ```
- Query ke database tidak dieksekusi sama sekali jika validasi gagal.

---

## 🔁 Langkah untuk Mereproduksi Bug (Steps to Reproduce)

1. Jalankan server dengan `bun run dev`.
2. Kirim request registrasi user dengan `name` sepanjang 300 karakter:
   ```bash
   curl -i -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{
       "name": "'$(python -c 'print("a"*300)')'",
       "email": "test300@localhost",
       "password": "password123"
     }'
   ```
3. Amati response yang diterima: server mencoba query ke MySQL dan mengembalikan error database alih-alih error validasi yang bersih.

---

## 📁 File yang Terkait

```text
src/
├── routes/
│   └── users-route.ts    # Layer routing & penanganan validasi input
└── services/
    └── user-service.ts   # Layer service logic registrasi user
```

---

## 🔧 Panduan Perbaikan Step-by-Step (Untuk Junior Programmer)

Berikut adalah tahapan yang perlu dilakukan untuk memperbaiki bug ini:

### Langkah 1: Tambahkan Validasi Panjang Karakter

Terdapat dua cara untuk menambahkan validasi. **Pilih salah satu (disarankan Cara A):**

#### Cara A: Menggunakan Schema Validation Elysia (`t` dari `elysia`) — *Paling Rapi & Standar*
Buka `src/routes/users-route.ts`. Elysia menyediakan TypeBox (`t`) bawaan untuk memvalidasi body secara otomatis.

1. Import `t` dari `elysia`:
   ```typescript
   import { Elysia, t } from "elysia";
   ```
2. Tambahkan schema validasi pada endpoint `POST /api/users`:
   ```typescript
   .post(
     "/api/users",
     async ({ body, set }) => {
       try {
         const { name, email, password } = body;
         await registerUser(name, email, password);
         set.status = 201;
         return { data: "ok" };
       } catch (error: any) {
         set.status = 400;
         return { error: error.message };
       }
     },
     {
       body: t.Object({
         name: t.String({
           minLength: 1,
           maxLength: 255,
           error: "nama wajib diisi dan maksimal 255 karakter",
         }),
         email: t.String({
           maxLength: 255,
           error: "email tidak valid",
         }),
         password: t.String({
           minLength: 1,
           maxLength: 255,
           error: "password wajib diisi",
         }),
       }),
     }
   )
   ```

#### Cara B: Validasi Manual di Service Layer (`src/services/user-service.ts`)
Jika tidak menggunakan schema Elysia, tambahkan pengecekan manual di awal fungsi `registerUser`:

```typescript
export async function registerUser(name: string, email: string, password: string) {
  if (!name || name.trim().length === 0) {
    throw new Error("nama wajib diisi");
  }
  if (name.length > 255) {
    throw new Error("nama tidak boleh lebih dari 255 karakter");
  }
  if (!email || email.length > 255) {
    throw new Error("email tidak valid atau terlalu panjang");
  }
  // Lanjutkan logic yang sudah ada...
}
```

---

### Langkah 2: Sanitasi Response Error

Pastikan di `src/routes/users-route.ts` pada blok `catch` tidak membocorkan query SQL mentah jika terjadi error database.

Gunakan pesan yang aman:
```typescript
catch (error: any) {
  set.status = 400;
  return { error: error.message || "Terjadi kesalahan pada input data" };
}
```

---

### Langkah 3: Verifikasi & Testing

1. **Jalankan type check:**
   ```bash
   bun check
   ```
   Pastikan tidak ada error tipe TypeScript.

2. **Uji Kasus Negatif (name > 255 karakter):**
   Kirim nama dengan 300 karakter.
   - Status harus `400 Bad Request`.
   - Response body harus berupa pesan error validasi (bukan error SQL query).

3. **Uji Kasus Positif (name normal $\le$ 255 karakter):**
   Kirim data valid dengan `name` normal (misal `"Raka"`).
   - Status harus `201 Created`.
   - Response body: `{"data": "ok"}`.

---

## ✅ Definition of Done (DoD)

- [x] Validasi batas panjang karakter `name` (maksimal 255 karakter) diterapkan.
- [x] Validasi dieksekusi sebelum query ke database dijalankan.
- [x] Pengiriman `name` dengan 300 karakter mengembalikan status HTTP 400 dengan pesan error yang jelas dan ramah pengguna.
- [x] Detail query SQL internal database tidak bocor ke client saat terjadi error.
- [x] Registrasi dengan data valid ($\le$ 255 karakter) tetap berjalan normal.
- [x] Type check (`bun check`) bebas dari error.
