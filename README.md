# Project Backend: Bun + ElysiaJS + Drizzle ORM + MySQL

Project template backend modern dan cepat menggunakan runtime **Bun**, framework **ElysiaJS**, serta ORM **Drizzle** dengan database **MySQL**.

---

## 🛠️ Tech Stack
- **Runtime & Package Manager:** [Bun](https://bun.com)
- **Web Framework:** [ElysiaJS](https://elysiajs.com)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **Database Driver:** `mysql2` (MySQL)
- **Tooling:** `drizzle-kit`, TypeScript

---

## 📁 Struktur Folder

```text
├── drizzle/              # File migrasi SQL hasil generate Drizzle
├── src/
│   ├── db/
│   │   ├── index.ts      # Inisialisasi pool MySQL & Drizzle instance
│   │   └── schema.ts     # Definisi schema database (table Drizzle)
│   └── index.ts          # Entry point server Elysia & endpoints
├── .env                  # Environment variables lokal (diabaikan git)
├── .env.example          # Template konfigurasi environment
├── .gitignore
├── drizzle.config.ts     # Konfigurasi Drizzle Kit untuk MySQL
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Memulai

### 1. Install Dependencies
```bash
bun install
```

### 2. Setup Environment Variables
Salin file `.env.example` menjadi `.env` lalu sesuaikan dengan kredensial MySQL lokal Anda:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=project_latihan
```

### 3. Database Migration (Drizzle Kit)
- **Generate migrasi:**
  ```bash
  bun run db:generate
  ```
- **Apply migrasi ke database:**
  ```bash
  bun run db:migrate
  ```
- **Push schema langsung ke database (development):**
  ```bash
  bun run db:push
  ```
- **Buka Drizzle Studio UI:**
  ```bash
  bun run db:studio
  ```

### 4. Menjalankan Server
- **Mode Development (Hot Reload):**
  ```bash
  bun run dev
  ```
- **Mode Production:**
  ```bash
  bun run start
  ```
- **Type Checking:**
  ```bash
  bun run typecheck
  ```

---

## 🔌 API Endpoints

- `GET /` : Endpoint selamat datang dan status server.
- `GET /health` : Health check status runtime dan verifikasi konektivitas ke database MySQL.
