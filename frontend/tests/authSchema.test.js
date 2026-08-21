import { loginSchema, registerSchema, resetPasswordSchema } from "../src/schemas/auth.schema.js";

describe("loginSchema", () => {
  test("accepts a valid email/password pair", () => {
    const result = loginSchema.safeParse({ email: "jane@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  test("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = { name: "Jane Doe", email: "jane@example.com", password: "Password123" };

  test("accepts a strong password", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  test("rejects a password missing an uppercase letter", () => {
    const result = registerSchema.safeParse({ ...base, password: "password123" });
    expect(result.success).toBe(false);
  });

  test("rejects a password missing a number", () => {
    const result = registerSchema.safeParse({ ...base, password: "Passwordonly" });
    expect(result.success).toBe(false);
  });

  test("rejects a name that's too short", () => {
    const result = registerSchema.safeParse({ ...base, name: "J" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  test("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "Password123", confirmPassword: "Password124" });
    expect(result.success).toBe(false);
  });

  test("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({ password: "Password123", confirmPassword: "Password123" });
    expect(result.success).toBe(true);
  });
});
