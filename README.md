# 🚀 User Management & Authentication API

Aplikasi backend REST API modern, aman, dan berkinerja tinggi untuk manajemen dan autentikasi user. Dibangun di atas runtime **Bun**, framework **ElysiaJS**, ORM **Drizzle**, serta database **MySQL**.

---

## 📑 Daftar Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Tech Stack & Libraries](#-tech-stack--libraries)
- [Arsitektur & Struktur Direktori](#-arsitektur--struktur-direktori)
- [Skema Database](#-skema-database)
- [Dokumentasi API](#-dokumentasi-api)
- [Panduan Setup Project](#-panduan-setup-project)
- [Cara Menjalankan Aplikasi](#-cara-menjalankan-aplikasi)
- [Pengujian Otomatis (Testing)](#-pengujian-otomatis-testing)

---

## 💡 Tentang Aplikasi

Aplikasi ini menyediakan sistem autentikasi dan manajemen akun berbasis session token dengan fitur-fitur utama:
- **Registrasi Akun Baru:** Mendaftarkan user dengan validasi input batas panjang karakter dan hashing password otomatis.
- **Login & Session Management:** Autentikasi kredensial user, pembuatan session token berbasis UUID, dan penyimpanan sesi ke database.
- **Profil User Terproteksi (`/current`):** Mengambil data profil user yang sedang login menggunakan otentikasi Bearer token dengan perlindungan kerahasiaan data (password tidak pernah dibocorkan ke client).
- **Logout (Pencabutan Sesi):** Menghapus record sesi aktif dari database secara permanen sehingga token tidak dapat disalahgunakan lagi.
- **Health Check & Monitoring:** Endpoint pemantauan status kesehatan server dan konektivitas database MySQL.
- **Automated Test Suite:** Dilengkapi pengujian otomatis komprehensif mencakup 26 skenario unit & integration test menggunakan Bun Test.

---

## 🛠️ Tech Stack & Libraries

| Kategori | Teknologi / Library | Versi | Deskripsi |
|---|---|---|---|
| **Runtime & Package Manager** | [Bun](https://bun.com) | v1.4+ | JavaScript/TypeScript runtime all-in-one yang sangat cepat |
| **Web Framework** | [ElysiaJS](https://elysiajs.com) | v1.4+ | Framework web TypeScript ergonomis dan berkinerja tinggi |
| **Object-Relational Mapping (ORM)** | [Drizzle ORM](https://orm.drizzle.team) | v0.45+ | TypeScript ORM tipe-aman (type-safe) yang ringan |
| **Database Driver** | [mysql2](https://github.com/sidorares/node-mysql2) | v3.24+ | Driver MySQL berperforma tinggi dengan dukungan Promise |
| **Database Engine** | MySQL | v8.0+ | Sistem manajemen basis data relasional |
| **Security & Hashing** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | v3.0+ | Hashing password satu arah dengan salt rounds 10 |
| **Database Migration Tool** | [drizzle-kit](https://orm.drizzle.team/kit-docs/overview) | v0.31+ | CLI generator migrasi dan manajemen schema Drizzle |
| **Testing Framework** | Bun Test (`bun:test`) | Bawaan | Test runner native bawaan Bun berkecepatan tinggi |
| **Bahasa Pemrograman** | TypeScript | v5+ / v7+ | Pengetikan statis penuh dengan konfigurasi strict |

---

## 📁 Arsitektur & Struktur Direktori

Project ini mengadopsi arsitektur berlapis (*Separation of Concerns* / SoC) yang memisahkan tanggung jawab antara definisi data, logika bisnis, antarmuka rute HTTP, dan pengujian:

```text
├── drizzle/                  # File migrasi SQL hasil generate Drizzle Kit
│   ├── 0000_*.sql            # Inisialisasi tabel users awal
│   ├── 0001_*.sql            # Penambahan kolom password
│   ├── 0002_*.sql            # Penambahan tabel sessions
│   ├── 0003_*.sql            # Constraint unik pada kolom token sessions
│   └── meta/                 # Snapshot skema dan journal migrasi
├── src/
│   ├── db/                   # Lapisan Database & Koneksi
│   │   ├── index.ts          # Inisialisasi MySQL connection pool & instance Drizzle ORM
│   │   └── schema.ts         # Definisi tabel Drizzle ORM (users & sessions) beserta tipe
│   ├── routes/               # Lapisan Routing (HTTP Controller)
│   │   └── users-route.ts    # Definisi route ElysiaJS, parsing header, & validasi input
│   ├── services/             # Lapisan Bisnis Logic (Service Layer)
│   │   └── user-service.ts   # Logika bisnis registrasi, login, get user, & logout
│   └── index.ts              # Entry point utama aplikasi Elysia server
├── tests/                    # Lapisan Pengujian Otomatis
│   └── users.test.ts         # Unit & Integration test suite lengkap (26 skenario)
├── .env                      # File konfigurasi environment lokal (diabaikan git)
├── .env.example              # Template contoh konfigurasi environment
├── .gitignore                # Daftar file/folder yang diabaikan oleh Git
├── bun.lock                  # Lockfile dependensi Bun
├── drizzle.config.ts         # File konfigurasi Drizzle Kit untuk dialek MySQL
├── package.json              # Manifest project, metadata, dependensi, dan skrip npm
├── tsconfig.json             # Konfigurasi TypeScript compiler
└── README.md                 # Dokumentasi utama project
```

### Konvensi Penamaan File & Folder:
- **Routes:** Disimpan di `src/routes/` dengan format penamaan `<domain>-route.ts` (contoh: `users-route.ts`).
- **Services:** Disimpan di `src/services/` dengan format penamaan `<domain>-service.ts` (contoh: `user-service.ts`).
- **Database:** Disimpan di `src/db/` (`schema.ts` untuk model tabel, `index.ts` untuk koneksi).
- **Tests:** Disimpan di `tests/` dengan format penamaan `<domain>.test.ts` (contoh: `users.test.ts`).

---

## 🗄️ Skema Database

Aplikasi menggunakan dua tabel relasional di MySQL yang didefinisikan secara type-safe di [src/db/schema.ts](file:///c:/PKL/Project%20Latihan/src/db/schema.ts):

### 1. Tabel `users`
Menyimpan informasi identitas dan kredensial pengguna.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `INT / SERIAL` | Primary Key, Auto Increment | Identifikasi unik pengguna |
| `name` | `VARCHAR(255)` | NOT NULL | Nama lengkap pengguna ($\le$ 255 karakter) |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Alamat email unik pengguna |
| `password` | `VARCHAR(255)` | NOT NULL | Password yang telah di-hash dengan bcrypt |
| `created_at`| `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Waktu pembuatan akun |

### 2. Tabel `sessions`
Menyimpan sesi login aktif pengguna yang terhubung dengan token otentikasi.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `INT / SERIAL` | Primary Key, Auto Increment | Identifikasi unik sesi |
| `token` | `VARCHAR(255)` | NOT NULL, UNIQUE | UUID token sesi otentikasi |
| `user_id` | `INT` | NOT NULL, FOREIGN KEY $\rightarrow$ `users.id` | Referensi ke pengguna pemilik sesi |
| `created_at`| `TIMESTAMP` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` | Waktu sesi dibuat |

> **Relasi Data:** Relasi `1:N` antara tabel `users` dan `sessions`. Satu pengguna dapat memiliki lebih dari satu sesi aktif di perangkat yang berbeda. Kolom `token` memiliki index unik untuk memastikan pencarian sesi berjalan secepat mungkin tanpa *full table scan*.

---

## 🔌 Dokumentasi API

Base URL lokal: `http://localhost:3000`

### 1. Root Endpoint
- **URL:** `GET /`
- **Deskripsi:** Endpoint pengenalan dan status aplikasi.
- **Response Sukses (200 OK):**
  ```json
  {
    "message": "Bun + ElysiaJS + Drizzle ORM (MySQL) API is running!",
    "health": "/health"
  }
  ```

---

### 2. Health Check
- **URL:** `GET /health`
- **Deskripsi:** Memeriksa status runtime Bun, framework Elysia, dan konektivitas pool database MySQL.
- **Response Sukses (200 OK):**
  ```json
  {
    "status": "online",
    "runtime": "bun",
    "framework": "elysia",
    "timestamp": "2026-11-17T06:00:00.000Z",
    "database": {
      "status": "connected"
    }
  }
  ```

---

### 3. Registrasi User Baru
- **URL:** `POST /api/users`
- **Deskripsi:** Mendaftarkan akun user baru. Password otomatis dienkripsi dengan bcrypt salt rounds 10.
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Raka Wildan",
    "email": "raka@localhost",
    "password": "rahasiaSuperKuat"
  }
  ```
- **Response Sukses (201 Created):**
  ```json
  {
    "data": "ok"
  }
  ```
- **Response Gagal (400 Bad Request):**
  ```json
  {
    "error": "email sudah terdaftar"
  }
  ```
  *(Atau pesan validasi lain: `"nama wajib diisi"`, `"nama tidak boleh lebih dari 255 karakter"`, `"email wajib diisi"`, `"password wajib diisi"`)*

---

### 4. Login User
- **URL:** `POST /api/users/login`
- **Deskripsi:** Memverifikasi kredensial email dan password. Jika cocok, mengembalikan UUID session token dan menyimpannya di database.
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "raka@localhost",
    "password": "rahasiaSuperKuat"
  }
  ```
- **Response Sukses (200 OK):**
  ```json
  {
    "data": "b47e24a8-6b8f-4318-8a82-3d849504a3e1"
  }
  ```
- **Response Gagal (401 Unauthorized):**
  ```json
  {
    "error": "email atau password salah"
  }
  ```

---

### 5. Get Current User Profile
- **URL:** `GET /api/users/current`
- **Deskripsi:** Mengambil data profil user yang saat ini sedang login berdasarkan token autentikasi. Field sensitif `password` dikecualikan dari response.
- **Headers:**
  ```http
  Authorization: Bearer <token-session-uuid>
  ```
- **Response Sukses (200 OK):**
  ```json
  {
    "data": {
      "id": 1,
      "name": "Raka Wildan",
      "email": "raka@localhost",
      "created_at": "2026-11-17T06:00:00.000Z"
    }
  }
  ```
- **Response Gagal (401 Unauthorized):**
  ```json
  {
    "error": "Unauthorized"
  }
  ```

---

### 6. Logout User
- **URL:** `DELETE /api/users/logout`
- **Deskripsi:** Menghapus record sesi user dari database berdasarkan token otentikasi. Token yang telah di-logout tidak dapat digunakan kembali.
- **Headers:**
  ```http
  Authorization: Bearer <token-session-uuid>
  ```
- **Response Sukses (200 OK):**
  ```json
  {
    "data": "ok"
  }
  ```
- **Response Gagal (401 Unauthorized):**
  ```json
  {
    "error": "Unauthorized"
  }
  ```

---

## ⚙️ Panduan Setup Project

### Prasyarat
Pastikan sistem Anda telah terpasang:
- [Bun](https://bun.com) (versi 1.1 atau yang lebih baru)
- MySQL Server (versi 8.0 atau yang lebih baru / MariaDB)

### Langkah 1: Clone Repository
```bash
git clone https://github.com/RakalendraWildan123/Belajar-Vibe-Coding.git
cd Belajar-Vibe-Coding
```

### Langkah 2: Install Dependensi
Jalankan instalasi paket melalui Bun:
```bash
bun install
```

### Langkah 3: Konfigurasi Environment Variable
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan kredensial database MySQL Anda:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=project_latihan
```

> **Catatan:** Pastikan database `project_latihan` sudah dibuat di MySQL Anda (`CREATE DATABASE project_latihan;`).

### Langkah 4: Eksekusi Migrasi Database
Jalankan migrasi Drizzle untuk membuat tabel `users` dan `sessions`:
```bash
# Opsi A: Eksekusi file migrasi terdaftar
bun run db:migrate

# Opsi B: Push schema langsung ke database (cepat untuk development)
bun run db:push
```

Untuk melihat dan mengelola data melalui browser GUI, Anda dapat menjalankan Drizzle Studio:
```bash
bun run db:studio
```

---

## 🏃 Cara Menjalankan Aplikasi

Tersedia beberapa perintah praktis yang telah didaftarkan di `package.json`:

### 1. Mode Development (Hot Reload)
Menjalankan server dalam mode watch, otomatis me-reload saat ada perubahan file:
```bash
bun run dev
```
Server akan aktif di: `http://localhost:3000`

### 2. Mode Production
Menjalankan server secara langsung tanpa watcher:
```bash
bun run start
```

### 3. Type Checking
Memeriksa integritas tipe TypeScript di seluruh file project:
```bash
bun run typecheck
```

---

## 🧪 Pengujian Otomatis (Testing)

Project ini dilengkapi rangkaian pengujian otomatis unit & integration test komprehensif menggunakan **Bun Test** di dalam file [tests/users.test.ts](file:///c:/PKL/Project%20Latihan/tests/users.test.ts).

### Menjalankan Seluruh Test Suite:
```bash
bun test
```
Atau menggunakan skrip npm:
```bash
bun run test
```

### Fitur & Ketahanan Test Suite:
1. **Pembersihan Data Otomatis (`beforeEach`):** Sebelum setiap skenario pengujian dieksekusi, database dibersihkan (mengosongkan tabel `sessions` lalu `users`) untuk mencegah ketergantungan antar-test (*test pollution*).
2. **26 Skenario Pengujian Menyeluruh:**
   - **Registrasi (8 skenario):** Data valid, penyimpanan password ter-hash bcrypt, penolakan email duplikat, validasi batas nama > 255 karakter, nama kosong/spasi, email kosong/terlalu panjang, dan password kosong.
   - **Login (5 skenario):** Kredensial valid, pembuatan session record di tabel `sessions`, email tidak terdaftar, password salah, dan request body kosong.
   - **Current User (5 skenario):** Akses dengan Bearer token valid, perlindungan kerahasiaan field `password`, tanpa auth header, format auth header tidak valid, dan token acak.
   - **Logout (6 skenario):** Logout sukses, penghapusan record dari tabel `sessions`, verifikasi token hangus saat diakses kembali, tanpa header, token tidak terdaftar, dan double logout.
   - **System Checks (2 skenario):** Root endpoint status dan health check database/runtime.
3. **Penyelesaian Koneksi Bersih (`afterAll`):** Mengosongkan data dan menutup koneksi pool MySQL secara aman setelah seluruh test selesai.
