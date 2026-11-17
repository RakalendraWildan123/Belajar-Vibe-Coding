import { Elysia, t } from "elysia";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/user-service";

function extractBearerToken(authHeader?: string): string {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new Error("Unauthorized");
  }

  return token;
}

export const usersRoute = new Elysia()
  .post(
    "/api/users",
    async ({ body, set }) => {
      try {
        const { name, email, password } = (body ?? {}) as {
          name?: string;
          email?: string;
          password?: string;
        };

        if (!name || name.trim().length === 0) {
          set.status = 400;
          return { error: "nama wajib diisi" };
        }

        if (name.length > 255) {
          set.status = 400;
          return { error: "nama tidak boleh lebih dari 255 karakter" };
        }

        if (!email || email.trim().length === 0) {
          set.status = 400;
          return { error: "email wajib diisi" };
        }

        if (email.length > 255) {
          set.status = 400;
          return { error: "email tidak boleh lebih dari 255 karakter" };
        }

        if (!password || password.length === 0) {
          set.status = 400;
          return { error: "password wajib diisi" };
        }

        await registerUser(name, email, password);

        set.status = 201;
        return { data: "ok" };
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Registrasi User Baru",
        description:
          "Mendaftarkan pengguna baru ke sistem dengan password yang di-hash menggunakan bcrypt.",
      },
      body: t.Object({
        name: t.String({
          description: "Nama lengkap pengguna (maksimal 255 karakter)",
          example: "Raka",
        }),
        email: t.String({
          description: "Alamat email unik pengguna",
          example: "raka@localhost",
        }),
        password: t.String({
          description: "Password akun pengguna",
          example: "rahasia123",
        }),
      }),
      response: {
        201: t.Object(
          {
            data: t.String({
              example: "ok",
              description: "Status keberhasilan registrasi user",
            }),
          },
          { description: "Registrasi pengguna baru berhasil" }
        ),
        400: t.Object(
          {
            error: t.String({
              example: "nama wajib diisi",
              description: "Pesan error validasi atau duplikasi email",
            }),
          },
          { description: "Validasi input gagal atau email sudah digunakan" }
        ),
      },
    }
  )
  .post(
    "/api/users/login",
    async ({ body, set }) => {
      try {
        const { email, password } = (body ?? {}) as {
          email?: string;
          password?: string;
        };

        if (!email || !password) {
          set.status = 401;
          return { error: "email atau password salah" };
        }

        const token = await loginUser(email, password);

        set.status = 200;
        return { data: token };
      } catch (error: any) {
        set.status = 401;
        return { error: error.message };
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Login Pengguna",
        description:
          "Memverifikasi email dan password serta membuat token sesi UUID untuk autentikasi.",
      },
      body: t.Object({
        email: t.String({
          description: "Alamat email terdaftar",
          example: "raka@localhost",
        }),
        password: t.String({
          description: "Password akun pengguna",
          example: "rahasia123",
        }),
      }),
      response: {
        200: t.Object(
          {
            data: t.String({
              example: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
              description: "Token sesi autentikasi (UUID)",
            }),
          },
          { description: "Login berhasil, menghasilkan token sesi" }
        ),
        401: t.Object(
          {
            error: t.String({
              example: "email atau password salah",
              description: "Pesan error kegagalan autentikasi",
            }),
          },
          { description: "Email atau password salah" }
        ),
      },
    }
  )
  .get(
    "/api/users/current",
    async ({ headers, set }) => {
      try {
        const token = extractBearerToken(headers["authorization"]);
        const user = await getCurrentUser(token);

        set.status = 200;
        return { data: user };
      } catch {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get Current User Profile",
        description:
          "Mengambil data profil pengguna yang sedang login berdasarkan Bearer token sesi.",
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object(
          {
            data: t.Object(
              {
                id: t.Number({
                  example: 1,
                  description: "ID unik pengguna",
                }),
                name: t.String({
                  example: "Raka",
                  description: "Nama lengkap pengguna",
                }),
                email: t.String({
                  example: "raka@localhost",
                  description: "Alamat email pengguna",
                }),
                created_at: t.Any({
                  example: "2026-11-17T07:00:00.000Z",
                  description: "Waktu pendaftaran akun",
                }),
              },
              { description: "Objek profil data pengguna" }
            ),
          },
          { description: "Berhasil mengambil profil pengguna saat ini" }
        ),
        401: t.Object(
          {
            error: t.String({
              example: "Unauthorized",
              description: "Pesan error otorisasi",
            }),
          },
          { description: "Token tidak disertakan atau sesi tidak valid" }
        ),
      },
    }
  )
  .delete(
    "/api/users/logout",
    async ({ headers, set }) => {
      try {
        const token = extractBearerToken(headers["authorization"]);
        await logoutUser(token);

        set.status = 200;
        return { data: "ok" };
      } catch {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Logout Pengguna",
        description:
          "Menghapus sesi login aktif pengguna dari database berdasarkan Bearer token.",
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object(
          {
            data: t.String({
              example: "ok",
              description: "Status keberhasilan logout",
            }),
          },
          { description: "Logout berhasil dan token sesi telah dihapus" }
        ),
        401: t.Object(
          {
            error: t.String({
              example: "Unauthorized",
              description: "Pesan error otorisasi",
            }),
          },
          { description: "Token tidak disertakan atau sesi tidak valid" }
        ),
      },
    }
  );
