import { Elysia } from "elysia";
import { registerUser } from "../services/user-service";

export const usersRoute = new Elysia().post(
  "/api/users",
  async ({ body, set }) => {
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
  }
);
