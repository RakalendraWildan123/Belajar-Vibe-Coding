# Feature: Automated Test Suite untuk Seluruh API (Bun Test)

## 📌 Ringkasan

Membuat rangkaian pengujian otomatis (unit/integration test) untuk seluruh endpoint API yang tersedia di project backend ini menggunakan test runner bawaan **Bun Test** (`bun test`).

Seluruh file test ditempatkan di dalam folder `tests/`. Setiap skenario pengujian harus menjalankan pembersihan data (cleanup) di awal agar kondisi database selalu konsisten dan terhindar dari *flaky tests* (efek samping data dari test sebelumnya).

Dokumen ini memuat daftar **skenario pengujian yang harus di-cover** tanpa mendikte kode implementasi secara mendalam, agar dapat diimplementasikan secara mandiri oleh junior programmer atau model AI.

---

## 🛠️ Spesifikasi Lingkungan Testing

- **Runner:** `bun test`
- **Direktori Test:** `tests/` (misalnya: `tests/users.test.ts`)
- **Pembersihan Data (Database Cleanup):**
  - Gunakan hook `beforeEach` (atau fungsi setup database) untuk mengosongkan tabel `sessions` terlebih dahulu, lalu mengosongkan tabel `users` sebelum setiap test case dijalankan.
- **Eksekusi Pengujian:**
  - Daftarkan skrip `"test": "bun test"` di `package.json` sehingga dapat dijalankan melalui perintah:
    ```bash
    bun test
    ```

---

## 📋 Daftar Skenario Pengujian per API

### 1. Endpoint: Registrasi User (`POST /api/users`)

#### Kasus Positif (Happy Path):
- **Skenario 1.1: Registrasi Berhasil dengan Data Valid**
  - Input: `name`, `email` unik, dan `password` valid ($\le$ 255 karakter).
  - Ekspektasi: HTTP 201 Created, Response: `{ "data": "ok" }`.
  - Verifikasi: Record user tersimpan di tabel `users`.
- **Skenario 1.2: Password Tersimpan dalam Bentuk Hash**
  - Ekspektasi: Password yang tersimpan di database bukan string plain text, melainkan hash bcrypt yang valid.

#### Kasus Negatif (Validasi & Error):
- **Skenario 1.3: Gagal Registrasi karena Email Duplikat**
  - Kondisi: Mendaftarkan email yang sudah ada di database.
  - Ekspektasi: HTTP 400 Bad Request, Response: `{ "error": "email sudah terdaftar" }`.
- **Skenario 1.4: Gagal Registrasi jika `name` Melebihi 255 Karakter**
  - Input: `name` sepanjang 300 karakter.
  - Ekspektasi: HTTP 400 Bad Request, Response: `{ "error": "nama tidak boleh lebih dari 255 karakter" }`.
  - Verifikasi: Query ke database tidak dieksekusi / tidak ada data tersimpan.
- **Skenario 1.5: Gagal Registrasi jika `name` Kosong atau Hanya Spasi**
  - Input: `name: ""` atau `name: "   "`.
  - Ekspektasi: HTTP 400 Bad Request, Response: `{ "error": "nama wajib diisi" }`.
- **Skenario 1.6: Gagal Registrasi jika `email` Kosong**
  - Input: `email: ""`.
  - Ekspektasi: HTTP 400 Bad Request, Response: `{ "error": "email wajib diisi" }`.
- **Skenario 1.7: Gagal Registrasi jika `email` Melebihi 255 Karakter**
  - Input: String email > 255 karakter.
  - Ekspektasi: HTTP 400 Bad Request.
- **Skenario 1.8: Gagal Registrasi jika `password` Kosong**
  - Input: `password: ""`.
  - Ekspektasi: HTTP 400 Bad Request, Response: `{ "error": "password wajib diisi" }`.

---

### 2. Endpoint: Login User (`POST /api/users/login`)

#### Kasus Positif (Happy Path):
- **Skenario 2.1: Login Berhasil dengan Kredensial Valid**
  - Kondisi: User sudah terdaftar sebelumnya.
  - Input: `email` dan `password` yang cocok.
  - Ekspektasi: HTTP 200 OK, Response: `{ "data": "<token-uuid>" }`.
- **Skenario 2.2: Sesi Tersimpan di Database**
  - Ekspektasi: Token yang dikembalikan terdaftar di tabel `sessions` dengan `user_id` milik user yang bersangkutan.

#### Kasus Negatif (Kredensial Salah):
- **Skenario 2.3: Gagal Login karena Email Tidak Terdaftar**
  - Input: Email yang belum pernah didaftarkan.
  - Ekspektasi: HTTP 401 Unauthorized, Response: `{ "error": "email atau password salah" }`.
- **Skenario 2.4: Gagal Login karena Password Salah**
  - Input: Email terdaftar, tetapi password salah.
  - Ekspektasi: HTTP 401 Unauthorized, Response: `{ "error": "email atau password salah" }`.
- **Skenario 2.5: Gagal Login jika Body Kosong / Data Tidak Lengkap**
  - Input: Body kosong `{}`.
  - Ekspektasi: HTTP 401 Unauthorized, Response: `{ "error": "email atau password salah" }`.

---

### 3. Endpoint: Get Current User (`GET /api/users/current`)

#### Kasus Positif (Happy Path):
- **Skenario 3.1: Berhasil Mengambil Profil dengan Bearer Token Valid**
  - Kondisi: User login dan memiliki token aktif.
  - Header: `Authorization: Bearer <valid-token>`.
  - Ekspektasi: HTTP 200 OK, Response berisi objek user `{ "data": { "id", "name", "email", "created_at" } }`.
- **Skenario 3.2: Keamanan Data (Field Password Tidak Boleh Bocor)**
  - Ekspektasi: Pada response data profil user, field `password` tidak boleh muncul sama sekali.

#### Kasus Negatif (Autentikasi Gagal):
- **Skenario 3.3: Gagal Akses Tanpa Header Authorization**
  - Header: Tidak menyertakan header `Authorization`.
  - Ekspektasi: HTTP 401 Unauthorized, Response: `{ "error": "Unauthorized" }`.
- **Skenario 3.4: Gagal Akses dengan Format Header Tidak Valid**
  - Header: `Authorization: Basic 12345` atau `Authorization: <token-tanpa-kata-Bearer>`.
  - Ekspektasi: HTTP 401 Unauthorized, Response: `{ "error": "Unauthorized" }`.
- **Skenario 3.5: Gagal Akses dengan Token Acak / Tidak Terdaftar**
  - Header: `Authorization: Bearer token-acak-palsu`.
  - Ekspektasi: HTTP 401 Unauthorized, Response: `{ "error": "Unauthorized" }`.

---

### 4. Endpoint: Logout User (`DELETE /api/users/logout`)

#### Kasus Positif (Happy Path):
- **Skenario 4.1: Logout Berhasil dengan Bearer Token Valid**
  - Kondisi: User login dan memiliki token aktif.
  - Header: `Authorization: Bearer <valid-token>`.
  - Ekspektasi: HTTP 200 OK, Response: `{ "data": "ok" }`.
- **Skenario 4.2: Sesi Terhapus dari Database**
  - Ekspektasi: Record token sesi tersebut sudah tidak ada lagi di tabel `sessions`.
- **Skenario 4.3: Token yang Sudah Di-logout Tidak Dapat Digunakan Kembali**
  - Alur: Login $\rightarrow$ Logout $\rightarrow$ Akses `GET /api/users/current` menggunakan token tersebut.
  - Ekspektasi pada request current user: HTTP 401 Unauthorized, Response: `{ "error": "Unauthorized" }`.

#### Kasus Negatif:
- **Skenario 4.4: Gagal Logout Tanpa Header Authorization**
  - Ekspektasi: HTTP 401 Unauthorized, Response: `{ "error": "Unauthorized" }`.
- **Skenario 4.5: Gagal Logout dengan Token yang Tidak Ada di Database**
  - Header: `Authorization: Bearer token-tidak-ditemukan`.
  - Ekspektasi: HTTP 401 Unauthorized, Response: `{ "error": "Unauthorized" }`.
- **Skenario 4.6: Gagal Logout Ulang (Double Logout)**
  - Alur: Melakukan request logout kedua kali dengan token yang baru saja di-logout.
  - Ekspektasi pada request kedua: HTTP 401 Unauthorized, Response: `{ "error": "Unauthorized" }`.

---

### 5. Endpoint Sistem / Health Check (Opsional Tambahan)

- **Skenario 5.1: Root Endpoint (`GET /`)**
  - Ekspektasi: HTTP 200 OK dengan informasi server.
- **Skenario 5.2: Health Check (`GET /health`)**
  - Ekspektasi: HTTP 200 OK dengan status runtime Bun & status konektivitas database.

---

## ✅ Definition of Done (DoD)

- [x] Folder `tests/` dibuat di root project.
- [x] Skrip `"test": "bun test"` terdaftar di `package.json`.
- [x] Terdapat mekanisme cleanup database sebelum setiap skenario dijalankan (`beforeEach`).
- [x] Seluruh skenario pengujian untuk `POST /api/users` terimplementasi.
- [x] Seluruh skenario pengujian untuk `POST /api/users/login` terimplementasi.
- [x] Seluruh skenario pengujian untuk `GET /api/users/current` terimplementasi.
- [x] Seluruh skenario pengujian untuk `DELETE /api/users/logout` terimplementasi.
- [x] Seluruh test dapat dijalankan dan lulus 100% menggunakan perintah `bun test`.
- [x] Type check (`bun check`) bebas dari error.
