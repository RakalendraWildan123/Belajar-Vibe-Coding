import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import app from "../src/index";
import { db, pool } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

// Periksa ketersediaan koneksi database
let isDbConnected = false;
try {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  isDbConnected = true;
} catch {
  isDbConnected = false;
}

// Helper untuk mengirim request ke instance Elysia
async function request(
  method: string,
  path: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  let body: string | undefined = undefined;

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await app.handle(
    new Request(`http://localhost:3000${path}`, {
      method,
      headers,
      body,
    })
  );

  const json: any = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

// Cleanup database sebelum setiap skenario agar data selalu konsisten
beforeEach(async () => {
  if (isDbConnected) {
    await db.delete(sessions);
    await db.delete(users);
  }
});

afterAll(async () => {
  if (isDbConnected) {
    await db.delete(sessions);
    await db.delete(users);
  }
  await pool.end();
});

describe("System Endpoints", () => {
  it("Skenario 5.1: Root endpoint GET / mengembalikan status 200", async () => {
    const res = await request("GET", "/");
    expect(res.status).toBe(200);
    expect(res.body?.message).toBeDefined();
  });

  it("Skenario 5.2: Health check GET /health mengembalikan status 200", async () => {
    const res = await request("GET", "/health");
    expect(res.status).toBe(200);
    expect(res.body?.status).toBe("online");
    expect(res.body?.runtime).toBe("bun");
    expect(res.body?.framework).toBe("elysia");
  });
});

describe("POST /api/users (Registrasi User)", () => {
  it.skipIf(!isDbConnected)(
    "Skenario 1.1: Registrasi berhasil dengan data valid",
    async () => {
      const res = await request("POST", "/api/users", {
        body: {
          name: "Raka",
          email: "raka@localhost",
          password: "rahasia123",
        },
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ data: "ok" });

      // Verifikasi data tersimpan di tabel users
      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, "raka@localhost"))
        .limit(1);
      expect(savedUser).toBeDefined();
      expect(savedUser!.name).toBe("Raka");
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 1.2: Password tersimpan dalam bentuk hash bcrypt (bukan plain text)",
    async () => {
      await request("POST", "/api/users", {
        body: {
          name: "Raka",
          email: "raka_hash@localhost",
          password: "plain_password_123",
        },
      });

      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, "raka_hash@localhost"))
        .limit(1);

      expect(savedUser).toBeDefined();
      expect(savedUser!.password).not.toBe("plain_password_123");
      expect(savedUser!.password.startsWith("$2")).toBe(true);
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 1.3: Gagal registrasi karena email duplikat",
    async () => {
      // Registrasi user pertama
      await request("POST", "/api/users", {
        body: {
          name: "Raka",
          email: "duplicate@localhost",
          password: "password123",
        },
      });

      // Registrasi user kedua dengan email yang sama
      const res = await request("POST", "/api/users", {
        body: {
          name: "Raka Duplikat",
          email: "duplicate@localhost",
          password: "password456",
        },
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "email sudah terdaftar" });
    }
  );

  it("Skenario 1.4: Gagal registrasi jika name melebihi 255 karakter", async () => {
    const res = await request("POST", "/api/users", {
      body: {
        name: "a".repeat(300),
        email: "toolong@localhost",
        password: "password123",
      },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "nama tidak boleh lebih dari 255 karakter",
    });
  });

  it("Skenario 1.5: Gagal registrasi jika name kosong atau hanya spasi", async () => {
    const resEmpty = await request("POST", "/api/users", {
      body: {
        name: "",
        email: "test@localhost",
        password: "password123",
      },
    });
    expect(resEmpty.status).toBe(400);
    expect(resEmpty.body).toEqual({ error: "nama wajib diisi" });

    const resWhitespace = await request("POST", "/api/users", {
      body: {
        name: "    ",
        email: "test@localhost",
        password: "password123",
      },
    });
    expect(resWhitespace.status).toBe(400);
    expect(resWhitespace.body).toEqual({ error: "nama wajib diisi" });
  });

  it("Skenario 1.6: Gagal registrasi jika email kosong", async () => {
    const res = await request("POST", "/api/users", {
      body: {
        name: "Raka",
        email: "",
        password: "password123",
      },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "email wajib diisi" });
  });

  it("Skenario 1.7: Gagal registrasi jika email melebihi 255 karakter", async () => {
    const res = await request("POST", "/api/users", {
      body: {
        name: "Raka",
        email: "a".repeat(256) + "@localhost",
        password: "password123",
      },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "email tidak boleh lebih dari 255 karakter",
    });
  });

  it("Skenario 1.8: Gagal registrasi jika password kosong", async () => {
    const res = await request("POST", "/api/users", {
      body: {
        name: "Raka",
        email: "raka@localhost",
        password: "",
      },
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "password wajib diisi" });
  });
});

describe("POST /api/users/login (Login User)", () => {
  it.skipIf(!isDbConnected)(
    "Skenario 2.1: Login berhasil dengan kredensial valid",
    async () => {
      // Registrasi user
      await request("POST", "/api/users", {
        body: {
          name: "Raka Login",
          email: "login_test@localhost",
          password: "password123",
        },
      });

      // Login
      const res = await request("POST", "/api/users/login", {
        body: {
          email: "login_test@localhost",
          password: "password123",
        },
      });

      expect(res.status).toBe(200);
      expect(typeof res.body.data).toBe("string");
      expect(res.body.data.length).toBeGreaterThan(0);
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 2.2: Sesi tersimpan di database dengan user_id yang cocok",
    async () => {
      await request("POST", "/api/users", {
        body: {
          name: "Raka Session",
          email: "session_test@localhost",
          password: "password123",
        },
      });

      const loginRes = await request("POST", "/api/users/login", {
        body: {
          email: "session_test@localhost",
          password: "password123",
        },
      });

      const token = loginRes.body.data;

      // Verifikasi token di tabel sessions
      const [savedSession] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      expect(savedSession).toBeDefined();
      expect(savedSession!.token).toBe(token);
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 2.3: Gagal login karena email tidak terdaftar",
    async () => {
      const res = await request("POST", "/api/users/login", {
        body: {
          email: "unregistered@localhost",
          password: "password123",
        },
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "email atau password salah" });
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 2.4: Gagal login karena password salah",
    async () => {
      await request("POST", "/api/users", {
        body: {
          name: "Raka Wrong Password",
          email: "wrong_pwd@localhost",
          password: "correctPassword",
        },
      });

      const res = await request("POST", "/api/users/login", {
        body: {
          email: "wrong_pwd@localhost",
          password: "incorrectPassword",
        },
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "email atau password salah" });
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 2.5: Gagal login jika body kosong",
    async () => {
      const res = await request("POST", "/api/users/login", {
        body: {},
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    }
  );
});

describe("GET /api/users/current (Get Current User)", () => {
  it.skipIf(!isDbConnected)(
    "Skenario 3.1: Berhasil mengambil profil dengan Bearer token valid",
    async () => {
      await request("POST", "/api/users", {
        body: {
          name: "Raka Current",
          email: "current_test@localhost",
          password: "password123",
        },
      });

      const loginRes = await request("POST", "/api/users/login", {
        body: {
          email: "current_test@localhost",
          password: "password123",
        },
      });

      const token = loginRes.body.data;

      const res = await request("GET", "/api/users/current", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe("Raka Current");
      expect(res.body.data.email).toBe("current_test@localhost");
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.created_at).toBeDefined();
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 3.2: Keamanan data - field password tidak ada di response body",
    async () => {
      await request("POST", "/api/users", {
        body: {
          name: "Raka Sec",
          email: "sec_test@localhost",
          password: "secret_password",
        },
      });

      const loginRes = await request("POST", "/api/users/login", {
        body: {
          email: "sec_test@localhost",
          password: "secret_password",
        },
      });

      const res = await request("GET", "/api/users/current", {
        headers: {
          Authorization: `Bearer ${loginRes.body.data}`,
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.data.password).toBeUndefined();
    }
  );

  it("Skenario 3.3: Gagal akses tanpa header Authorization", async () => {
    const res = await request("GET", "/api/users/current");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("Skenario 3.4: Gagal akses dengan format header tidak valid", async () => {
    const resBasic = await request("GET", "/api/users/current", {
      headers: { Authorization: "Basic 12345" },
    });
    expect(resBasic.status).toBe(401);
    expect(resBasic.body).toEqual({ error: "Unauthorized" });

    const resNoBearer = await request("GET", "/api/users/current", {
      headers: { Authorization: "token-tanpa-kata-bearer" },
    });
    expect(resNoBearer.status).toBe(401);
    expect(resNoBearer.body).toEqual({ error: "Unauthorized" });
  });

  it.skipIf(!isDbConnected)(
    "Skenario 3.5: Gagal akses dengan token acak / tidak terdaftar",
    async () => {
      const res = await request("GET", "/api/users/current", {
        headers: {
          Authorization: "Bearer token-acak-palsu-123",
        },
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    }
  );
});

describe("DELETE /api/users/logout (Logout User)", () => {
  it.skipIf(!isDbConnected)(
    "Skenario 4.1: Logout berhasil dengan Bearer token valid",
    async () => {
      await request("POST", "/api/users", {
        body: {
          name: "Raka Logout",
          email: "logout_test@localhost",
          password: "password123",
        },
      });

      const loginRes = await request("POST", "/api/users/login", {
        body: {
          email: "logout_test@localhost",
          password: "password123",
        },
      });

      const token = loginRes.body.data;

      const res = await request("DELETE", "/api/users/logout", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: "ok" });
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 4.2: Sesi terhapus dari database setelah logout",
    async () => {
      await request("POST", "/api/users", {
        body: {
          name: "Raka Logout DB",
          email: "logout_db@localhost",
          password: "password123",
        },
      });

      const loginRes = await request("POST", "/api/users/login", {
        body: {
          email: "logout_db@localhost",
          password: "password123",
        },
      });

      const token = loginRes.body.data;

      // Logout
      await request("DELETE", "/api/users/logout", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Cek apakah session masih ada
      const [deletedSession] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      expect(deletedSession).toBeUndefined();
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 4.3: Token yang sudah di-logout tidak dapat dipakai lagi",
    async () => {
      await request("POST", "/api/users", {
        body: {
          name: "Raka Re-check",
          email: "recheck@localhost",
          password: "password123",
        },
      });

      const loginRes = await request("POST", "/api/users/login", {
        body: {
          email: "recheck@localhost",
          password: "password123",
        },
      });

      const token = loginRes.body.data;

      // Logout
      await request("DELETE", "/api/users/logout", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Coba akses current user dengan token yang sudah di-logout
      const currentRes = await request("GET", "/api/users/current", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(currentRes.status).toBe(401);
      expect(currentRes.body).toEqual({ error: "Unauthorized" });
    }
  );

  it("Skenario 4.4: Gagal logout tanpa header Authorization", async () => {
    const res = await request("DELETE", "/api/users/logout");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it.skipIf(!isDbConnected)(
    "Skenario 4.5: Gagal logout dengan token yang tidak ada di database",
    async () => {
      const res = await request("DELETE", "/api/users/logout", {
        headers: {
          Authorization: "Bearer token-tidak-ada-9999",
        },
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    }
  );

  it.skipIf(!isDbConnected)(
    "Skenario 4.6: Gagal logout ulang dengan token yang sama (double logout)",
    async () => {
      await request("POST", "/api/users", {
        body: {
          name: "Raka Double Logout",
          email: "double_logout@localhost",
          password: "password123",
        },
      });

      const loginRes = await request("POST", "/api/users/login", {
        body: {
          email: "double_logout@localhost",
          password: "password123",
        },
      });

      const token = loginRes.body.data;

      // Logout pertama -> sukses
      const firstLogout = await request("DELETE", "/api/users/logout", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(firstLogout.status).toBe(200);

      // Logout kedua dengan token yang sama -> gagal
      const secondLogout = await request("DELETE", "/api/users/logout", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(secondLogout.status).toBe(401);
      expect(secondLogout.body).toEqual({ error: "Unauthorized" });
    }
  );
});

describe("Swagger / OpenAPI Documentation", () => {
  it("Skenario 6.1: Swagger UI GET /swagger dapat diakses", async () => {
    const res = await app.handle(new Request("http://localhost:3000/swagger"));
    expect(res.status).toBe(200);
  });

  it("Skenario 6.2: OpenAPI Spec JSON GET /swagger/json mengembalikan spesifikasi yang valid", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/swagger/json")
    );
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

