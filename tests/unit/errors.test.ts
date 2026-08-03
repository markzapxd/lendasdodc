import { describe, expect, it } from "vitest";
import { type AppError, createError, isAppError } from "../../src/lib/errors";

describe("application errors", () => {
  it.each([
    ["NOT_FOUND", createError("NOT_FOUND", "card")],
    ["UNAUTHORIZED", createError("UNAUTHORIZED", "missing session")],
    ["FORBIDDEN", createError("FORBIDDEN", "insufficient permissions")],
    ["VALIDATION", createError("VALIDATION", "message", "must not be empty")],
    ["RATE_LIMITED", createError("RATE_LIMITED", 30)],
    ["REDIS_UNAVAILABLE", createError("REDIS_UNAVAILABLE")],
    ["DATABASE_ERROR", createError("DATABASE_ERROR", "23505")],
    ["EXTERNAL_SERVICE_ERROR", createError("EXTERNAL_SERVICE_ERROR", "turnstile", "timeout")],
    ["INTERNAL_ERROR", createError("INTERNAL_ERROR", "unexpected failure")],
  ] satisfies readonly [string, AppError][])("creates the %s error", (_type, error) => {
    expect(error.type).toBe(_type);
    expect(isAppError(error)).toBe(true);
  });

  it("accepts every valid discriminated error shape", () => {
    const errors: readonly AppError[] = [
      { type: "NOT_FOUND", resource: "card" },
      { type: "UNAUTHORIZED", reason: "missing session" },
      { type: "FORBIDDEN", reason: "insufficient permissions" },
      { type: "VALIDATION", field: "message", message: "must not be empty" },
      { type: "RATE_LIMITED", retryAfter: 30 },
      { type: "REDIS_UNAVAILABLE" },
      { type: "DATABASE_ERROR", code: "23505" },
      { type: "EXTERNAL_SERVICE_ERROR", service: "turnstile", code: "timeout" },
      { type: "INTERNAL_ERROR", message: "unexpected failure" },
    ];

    for (const error of errors) {
      expect(isAppError(error)).toBe(true);
    }
  });

  it("rejects values with an unknown discriminator or missing fields", () => {
    expect(isAppError({ type: "UNKNOWN_ERROR" })).toBe(false);
    expect(isAppError({ type: "NOT_FOUND" })).toBe(false);
    expect(isAppError({ type: "RATE_LIMITED", retryAfter: "30" })).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError("NOT_FOUND")).toBe(false);
  });

  it("supports discrimination by error type", () => {
    const error = createError("VALIDATION", "nickname", "is too long");
    let message = "";

    switch (error.type) {
      case "VALIDATION":
        message = `${error.field}: ${error.message}`;
        break;
      default:
        message = "unexpected";
    }

    expect(message).toBe("nickname: is too long");
  });
});
