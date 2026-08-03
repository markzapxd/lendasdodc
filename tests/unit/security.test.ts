import { describe, expect, it } from "vitest";

describe("Security Headers", () => {
  it("includes all required hardening headers", async () => {
    const { securityHeaders } = await import("@/lib/security/headers");

    const headerKeys = securityHeaders.map((header) => header.key);

    expect(headerKeys).toContain("Strict-Transport-Security");
    expect(headerKeys).toContain("X-Frame-Options");
    expect(headerKeys).toContain("X-Content-Type-Options");
    expect(headerKeys).toContain("Referrer-Policy");
    expect(headerKeys).toContain("Permissions-Policy");
  });
});

describe("Content Security Policy", () => {
  it("allows the configured Supabase origin and protects key directives", async () => {
    const { buildCSP } = await import("@/lib/security/csp");

    const csp = buildCSP({ supabaseUrl: "https://example.supabase.co" });

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("example.supabase.co");
  });

  it("uses the report-only header when requested", async () => {
    const { getCSPHeaders } = await import("@/lib/security/csp");

    expect(getCSPHeaders({ supabaseUrl: "https://example.supabase.co", reportOnly: true })).toEqual(
      expect.objectContaining({ key: "Content-Security-Policy-Report-Only" }),
    );
  });
});
