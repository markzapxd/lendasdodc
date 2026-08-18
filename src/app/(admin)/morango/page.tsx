"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { LockKey, ShieldCheck, User } from "@phosphor-icons/react";
import { z } from "zod";

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
        router.push("/abacaxi");
      } else {
        const payload: unknown = await response.json();
        const parsed = loginResponseSchema.safeParse(payload);
        setError(parsed.success && parsed.data.error ? parsed.data.error : "Erro ao fazer login");
      }
    } catch {
      setError("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08040d] px-4 py-12 select-none">
      <div className="w-full max-w-md rounded-2xl border border-[#2b1742] bg-[#12081a]/90 p-8 shadow-[0_0_50px_rgba(236,25,90,0.12)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ec195a]/40 bg-[#210d2e] shadow-[0_0_20px_rgba(236,25,90,0.3)]">
            <ShieldCheck className="h-7 w-7 text-[#ec195a]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">Painel Administrativo</h1>
          <p className="mt-1 text-xs font-mono text-[#a595b8]/70">LARP - Acesso Restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email / Username Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-mono text-[#a595b8]">
              Usuário ou E-mail
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-[#a595b8]/60" />
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu usuário"
                autoComplete="username"
                required
                className="w-full rounded-xl border border-[#2b1742] bg-[#0b0512] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#a595b8]/40 outline-none transition-colors focus:border-[#ec195a]/70"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-mono text-[#a595b8]">
              Senha
            </label>
            <div className="relative flex items-center">
              <LockKey className="absolute left-3.5 h-4 w-4 text-[#a595b8]/60" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-[#2b1742] bg-[#0b0512] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#a595b8]/40 outline-none transition-colors focus:border-[#ec195a]/70"
              />
            </div>
          </div>

          {/* TOTP Code Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="totp" className="text-xs font-mono text-[#a595b8]">
              Código 2FA / TOTP
            </label>
            <div className="relative flex items-center">
              <ShieldCheck className="absolute left-3.5 h-4 w-4 text-[#a595b8]/60" />
              <input
                id="totp"
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="000000"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
                className="w-full rounded-xl border border-[#2b1742] bg-[#0b0512] py-2.5 pl-10 pr-4 text-sm font-mono text-white placeholder:text-[#a595b8]/40 outline-none transition-colors focus:border-[#ec195a]/70"
              />
            </div>
          </div>

          {error ? (
            <div className="mt-1 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#ec195a] py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(236,25,90,0.4)] transition-all hover:bg-[#d4144e] disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar no Painel"}
          </button>
        </form>
      </div>
    </div>
  );
}
