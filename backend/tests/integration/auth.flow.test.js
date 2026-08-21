import request from "supertest";
import { createApp } from "../../src/app.js";

const app = createApp();

const credentials = {
  name: "Jane Doe",
  email: "jane@example.com",
  password: "Password123",
};

describe("Auth flow", () => {
  test("registers a new patient account", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(credentials.email);
    expect(res.body.data.user.role).toBe("patient");
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/);
  });

  test("rejects duplicate registration", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/register").send(credentials);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("logs in with correct credentials and rejects wrong password", async () => {
    await request(app).post("/api/auth/register").send(credentials);

    const good = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(good.status).toBe(200);
    expect(good.body.data.accessToken).toBeDefined();

    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "WrongPassword1" });
    expect(bad.status).toBe(401);
    expect(bad.body.success).toBe(false);
  });

  test("returns the current user for a valid access token", async () => {
    const register = await request(app).post("/api/auth/register").send(credentials);
    const accessToken = register.body.data.accessToken;

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(credentials.email);
  });

  test("rejects protected routes without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("issues a new access token from the refresh cookie", async () => {
    const register = await request(app).post("/api/auth/register").send(credentials);
    const cookie = register.headers["set-cookie"][0];

    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test("logout revokes the refresh token", async () => {
    const register = await request(app).post("/api/auth/register").send(credentials);
    const cookie = register.headers["set-cookie"][0];
    const accessToken = register.body.data.accessToken;

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Cookie", cookie);
    expect(logout.status).toBe(200);

    const refreshAfterLogout = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(refreshAfterLogout.status).toBe(401);
  });
});
