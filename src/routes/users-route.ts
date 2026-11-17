import { Elysia } from "elysia";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/user-service";

export const usersRoute = new Elysia()
  .post("/api/users", async ({ body, set }) => {
    try {
      const { name, email, password } = body as {
        name: string;
        email: string;
        password: string;
      };

      await registerUser(name, email, password);

      set.status = 201;
      return { data: "ok" };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  })
  .post("/api/users/login", async ({ body, set }) => {
    try {
      const { email, password } = body as {
        email: string;
        password: string;
      };

      const token = await loginUser(email, password);

      set.status = 200;
      return { data: token };
    } catch (error: any) {
      set.status = 401;
      return { error: error.message };
    }
  })
  .get("/api/users/current", async ({ headers, set }) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const token = authHeader.slice(7).trim();
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const user = await getCurrentUser(token);

      set.status = 200;
      return { data: user };
    } catch (error: any) {
      set.status = 401;
      return { error: error.message };
    }
  })
  .delete("/api/users/logout", async ({ headers, set }) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const token = authHeader.slice(7).trim();
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      await logoutUser(token);

      set.status = 200;
      return { data: "ok" };
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  });
