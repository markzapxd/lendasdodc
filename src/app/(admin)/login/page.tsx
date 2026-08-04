"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginResponseSchema = z.object({
  error: z.string().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totpCode }),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        const payload: unknown = await response.json();
        const parsed = loginResponseSchema.safeParse(payload);
        setError(parsed.success && parsed.data.error ? parsed.data.error : "Erro ao fazer login");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-charcoal-900 px-4">
      <div className="w-full max-w-md rounded-md border border-border bg-surface-elevated p-6 sm:p-8">
        <h1 className="mb-8 text-center text-2xl font-bold text-text-primary">Login Admin</h1>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Input
            id="email"
            label="Usuário ou Email"
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />

          <Input
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <Input
            id="totp"
            label="Código TOTP"
            type="text"
            value={totpCode}
            onChange={(event) => setTotpCode(event.target.value)}
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            placeholder="000000"
            required
          />

          {error ? (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
