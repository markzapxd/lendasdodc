"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginResponseSchema = z.object({ error: z.string().optional() });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backgroundOffset, setBackgroundOffset] = useState(0);

  useEffect(() => {
    const updateBackgroundOffset = () => setBackgroundOffset(window.scrollY * 0.18);
    updateBackgroundOffset();
    window.addEventListener("scroll", updateBackgroundOffset, { passive: true });
    return () => window.removeEventListener("scroll", updateBackgroundOffset);
  }, []);

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
        router.push("/abacaxi");
      } else {
        const parsed = loginResponseSchema.safeParse(await response.json());
        setError(parsed.success && parsed.data.error ? parsed.data.error : "Erro ao fazer login");
      }
    } catch {
      setError("Erro de conexão com o servidor");
    }
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#08040d] px-5 py-10 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-[-12%] bg-cover bg-center opacity-60"
        style={{
          backgroundImage: "url('/imagens/fundo.jpg')",
          transform: `translateY(${backgroundOffset}px) scale(1.16)`,
        }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-black/50" />
      <div className="relative w-full max-w-sm">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <Input
            id="email"
            label="Usuário"
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
            autoFocus
            className="border-white/15 bg-white/[0.03] text-white focus-visible:border-[#ec195a]"
          />
          <Input
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="border-white/15 bg-white/[0.03] text-white focus-visible:border-[#ec195a]"
          />
          <Input
            id="totp"
            label="Código"
            type="text"
            value={totpCode}
            onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="border-white/15 bg-white/[0.03] font-mono tracking-[0.25em] text-white focus-visible:border-[#ec195a]"
          />
          {error ? (
            <p className="border-l-2 border-red-400 pl-3 text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={loading} className="mt-1 w-full rounded-lg">
            Entrar
          </Button>
        </form>
      </div>
    </main>
  );
}
