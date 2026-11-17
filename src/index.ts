import { Elysia } from "elysia";
import { pool } from "./db";
import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .get("/", () => ({
    message: "Bun + ElysiaJS + Drizzle ORM (MySQL) API is running!",
    health: "/health",
  }))
  .get("/health", async () => {
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
  })
  .use(usersRoute)
  .listen(Number(process.env.PORT) || 3000);

console.log(
  `🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);

export default app;
export type App = typeof app;
