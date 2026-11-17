import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { pool } from "./db";
import { usersRoute } from "./routes/users-route";

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
          {
            name: "System",
            description: "Endpoint informasi server & health check",
          },
          {
            name: "Users",
            description: "Endpoint autentikasi dan manajemen akun user",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "UUID",
              description:
                "Masukkan token sesi yang didapatkan dari endpoint login",
            },
          },
        },
      },
    })
  )
  .get(
    "/",
    () => ({
      message: "Bun + ElysiaJS + Drizzle ORM (MySQL) API is running!",
      health: "/health",
      swagger: "/swagger",
    }),
    {
      detail: {
        tags: ["System"],
        summary: "Root Info",
        description: "Informasi status aplikasi server dan tautan dokumentasi",
      },
    }
  )
  .get(
    "/health",
    async () => {
      let dbStatus = "connected";
      let dbError: string | null = null;

      try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
      } catch (error: any) {
        dbStatus = "disconnected";
        dbError = error?.message ?? "Failed to connect to MySQL database";
      }

      return {
        status: "online",
        runtime: "bun",
        framework: "elysia",
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          ...(dbError ? { message: dbError } : {}),
        },
      };
    },
    {
      detail: {
        tags: ["System"],
        summary: "Health Check",
        description: "Memeriksa status runtime dan koneksi database MySQL",
      },
    }
  )
  .use(usersRoute)
  .listen(Number(process.env.PORT) || 3000);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);

export default app;
export type App = typeof app;
