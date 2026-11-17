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
    }
  );
