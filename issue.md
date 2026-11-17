# Feature: Integrasi Swagger / OpenAPI Documentation (@elysiajs/swagger)

## 📌 Ringkasan

Menambahkan fitur dokumentasi API interaktif **Swagger UI / OpenAPI** ke dalam project backend ElysiaJS ini. Dengan adanya Swagger UI, developer atau pengguna lain dapat membaca spesifikasi seluruh endpoint, melihat skema request/response, dan mencoba memanggil API secara langsung melalui browser di alamat `http://localhost:3000/swagger`.

Dokumen ini disusun sebagai panduan implementasi langkah demi langkah (*step-by-step*) yang jelas dan detail bagi junior programmer atau model AI untuk mengeksekusi fitur ini.

---

## 🎯 Tujuan & Spesifikasi Fitur

1. **Endpoint Swagger UI:** Dapat diakses melalui browser di path:
   ```http
   GET /swagger
   ```
2. **Endpoint OpenAPI Spec JSON:**
   ```http
   GET /swagger/json
   ```
3. **Konfigurasi Info Dokumentasi:**
   - **Title:** `User Management & Authentication API`
   - **Version:** `1.0.0`
   - **Description:** Dokumentasi REST API untuk registrasi, login, manajemen profil user, dan logout berbasis session token.
4. **Dukungan Autentikasi di Swagger (Authorize Button):**
   - Mendukung skema keamanan `BearerAuth` (HTTP Bearer token) agar pengguna bisa memasukkan token login langsung di Swagger UI untuk mencoba endpoint terproteksi (`/current` dan `/logout`).
5. **Dokumentasi Lengkap Tiap Endpoint:**
   - Menyertakan **Tag**, **Summary**, **Description**, **Request Body Schema**, **Header Schema**, dan **Response Schema** (200, 201, 400, 401).
6. **Automated Unit Testing:**
   - Menambahkan pengujian otomatis di `tests/` untuk memverifikasi endpoint `/swagger` dan `/swagger/json` dapat diakses dengan sukses (Status 200 OK).

---

## 📁 File yang Terkait

```text
├── package.json              # (update) Menambahkan dependensi @elysiajs/swagger
├── src/
│   ├── index.ts              # (update) Inisialisasi plugin swagger() dengan metadata
│   └── routes/
│       └── users-route.ts    # (update) Menambahkan detail schema TypeBox (t) & tags OpenAPI
└── tests/
    └── users.test.ts         # (update) Menambahkan unit test untuk endpoint swagger
```

---

## 🔧 Panduan Implementasi Step-by-Step

### Tahap 1: Instalasi Paket `@elysiajs/swagger`

Jalankan perintah instalasi paket resmi plugin Swagger untuk Elysia melalui terminal:

```bash
bun add @elysiajs/swagger
```

---

### Tahap 2: Konfigurasi Plugin Swagger di `src/index.ts`

Buka file `src/index.ts`. Daftarkan plugin `swagger` pada instance Elysia sebelum route lain didaftarkan.

#### Yang perlu dilakukan:
1. Import `swagger` dari `@elysiajs/swagger`:
   ```typescript
   import { swagger } from "@elysiajs/swagger";
   ```
2. Tambahkan `.use(swagger({ ... }))` ke instance `app` dengan konfigurasi OpenAPI:
   ```typescript
   export const app = new Elysia()
     .use(
       swagger({
         documentation: {
           info: {
             title: "User Management & Authentication API",
             version: "1.0.0",
             description:
               "Dokumentasi REST API backend menggunakan Bun, ElysiaJS, Drizzle ORM, dan MySQL.",
           },
           tags: [
             { name: "System", description: "Endpoint informasi server & health check" },
             { name: "Users", description: "Endpoint autentikasi dan manajemen akun user" },
           ],
           components: {
             securitySchemes: {
               bearerAuth: {
                 type: "http",
                 scheme: "bearer",
                 bearerFormat: "UUID",
                 description: "Masukkan token sesi yang didapatkan dari endpoint login",
               },
             },
           },
         },
       })
     )
     .get("/", () => ({ ... }), {
       detail: {
         tags: ["System"],
         summary: "Root Info",
         description: "Informasi status aplikasi server",
       },
     })
     .get("/health", async () => { ... }, {
       detail: {
         tags: ["System"],
         summary: "Health Check",
         description: "Memeriksa status runtime dan koneksi database MySQL",
       },
     })
     .use(usersRoute)
     .listen(Number(process.env.PORT) || 3000);
   ```

---

### Tahap 3: Lengkapi Metadata OpenAPI di `src/routes/users-route.ts`

Buka file `src/routes/users-route.ts`. Import `t` dari `elysia` untuk melengkapi setiap endpoint dengan schema request, response, dan dokumentasi OpenAPI.

```typescript
import { Elysia, t } from "elysia";
```

Tambahkan opsi konfigurasi pada setiap endpoint:

#### 1. `POST /api/users` (Registrasi):
```typescript
.post(
  "/api/users",
  async ({ body, set }) => { ... },
  {
    detail: {
      tags: ["Users"],
      summary: "Registrasi User Baru",
      description: "Mendaftarkan pengguna baru ke sistem dengan password yang di-hash menggunakan bcrypt.",
    },
    body: t.Object({
      name: t.String({ description: "Nama lengkap (maks 255 karakter)", minLength: 1, maxLength: 255 }),
      email: t.String({ description: "Alamat email unik pengguna", maxLength: 255 }),
      password: t.String({ description: "Password akun pengguna", minLength: 1, maxLength: 255 }),
    }),
    response: {
      201: t.Object({ data: t.String() }),
      400: t.Object({ error: t.String() }),
    },
  }
)
```

#### 2. `POST /api/users/login` (Login):
```typescript
.post(
  "/api/users/login",
  async ({ body, set }) => { ... },
  {
    detail: {
      tags: ["Users"],
      summary: "Login Pengguna",
      description: "Memverifikasi kredensial email dan password serta menghasilkan UUID token sesi.",
    },
    body: t.Object({
      email: t.String({ description: "Alamat email terdaftar" }),
      password: t.String({ description: "Password akun pengguna" }),
    }),
    response: {
      200: t.Object({ data: t.String() }),
      401: t.Object({ error: t.String() }),
    },
  }
)
```

#### 3. `GET /api/users/current` (Get Profile Pengguna):
```typescript
.get(
  "/api/users/current",
  async ({ headers, set }) => { ... },
  {
    detail: {
      tags: ["Users"],
      summary: "Get Current User Profile",
      description: "Mengambil data profil pengguna yang sedang login berdasarkan token sesi.",
      security: [{ bearerAuth: [] }],
    },
    headers: t.Object({
      authorization: t.String({ description: "Format: Bearer <token-uuid>" }),
    }),
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          created_at: t.Any(),
        }),
      }),
      401: t.Object({ error: t.String() }),
    },
  }
)
```

#### 4. `DELETE /api/users/logout` (Logout):
```typescript
.delete(
  "/api/users/logout",
  async ({ headers, set }) => { ... },
  {
    detail: {
      tags: ["Users"],
      summary: "Logout Pengguna",
      description: "Menghapus sesi login aktif pengguna dari database.",
      security: [{ bearerAuth: [] }],
    },
    headers: t.Object({
      authorization: t.String({ description: "Format: Bearer <token-uuid>" }),
    }),
    response: {
      200: t.Object({ data: t.String() }),
      401: t.Object({ error: t.String() }),
    },
  }
)
```

---

### Tahap 4: Tambahkan Unit Test untuk Endpoint Swagger

Buka file `tests/users.test.ts`. Tambahkan blok pengujian untuk Swagger:

```typescript
describe("Swagger / OpenAPI Documentation", () => {
  it("Skenario 6.1: Swagger UI GET /swagger dapat diakses", async () => {
    const res = await app.handle(new Request("http://localhost:3000/swagger"));
    expect(res.status).toBe(200);
  });

  it("Skenario 6.2: OpenAPI Spec JSON GET /swagger/json mengembalikan spesifikasi yang valid", async () => {
    const res = await app.handle(new Request("http://localhost:3000/swagger/json"));
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.openapi).toBeDefined();
    expect(json.info.title).toBe("User Management & Authentication API");
    expect(json.paths["/api/users"]).toBeDefined();
    expect(json.paths["/api/users/login"]).toBeDefined();
    expect(json.paths["/api/users/current"]).toBeDefined();
    expect(json.paths["/api/users/logout"]).toBeDefined();
  });
});
```

---

### Tahap 5: Verifikasi & Testing

1. **Jalankan Type Check:**
   ```bash
   bun check
   ```
   Pastikan tidak ada kesalahan tipe TypeScript (0 errors).

2. **Jalankan Seluruh Test Suite:**
   ```bash
   bun test
   ```
   Pastikan seluruh test, termasuk test Swagger yang baru ditambahkan, lulus dengan sukses.

3. **Verifikasi Visual di Browser:**
   - Jalankan server: `bun run dev`
   - Buka browser di alamat: `http://localhost:3000/swagger`
   - Pastikan halaman Swagger UI tampil rapi, seluruh endpoint terdaftar, dan tombol **Authorize** dapat digunakan.

---

## ✅ Definition of Done (DoD)

- [x] Paket `@elysiajs/swagger` berhasil di-install dan tercatat di `package.json`.
- [x] Plugin `swagger()` terpasang di `src/index.ts` dengan metadata info, tags, dan skema keamanan `BearerAuth`.
- [x] Endpoint `POST /api/users`, `POST /api/users/login`, `GET /api/users/current`, dan `DELETE /api/users/logout` telah dilengkapi metadata OpenAPI (tags, summary, request/response schema).
- [x] Halaman Swagger UI dapat diakses di `http://localhost:3000/swagger`.
- [x] Endpoint JSON spesifikasi OpenAPI dapat diakses di `http://localhost:3000/swagger/json`.
- [x] Unit test untuk endpoint Swagger ditambahkan di `tests/users.test.ts`.
- [x] Seluruh unit test lulus saat dijalankan dengan `bun test`.
- [x] Pemeriksaan tipe (`bun check`) bebas dari error.
