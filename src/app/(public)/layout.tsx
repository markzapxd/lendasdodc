import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "larplandia",
  description: "",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-gradient-to-b from-sky-200 via-purple-950 via-60% to-red-950 text-slate-100">
      {/* Background celestial to infernal ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Top: Céu (Celestial Ambient Aura) */}
        <div className="animate-float-slow absolute -left-20 -top-20 h-[36rem] w-[36rem] rounded-full bg-sky-300/40 blur-3xl" />
        <div className="animate-float-reverse absolute -right-20 top-10 h-[32rem] w-[32rem] rounded-full bg-amber-200/30 blur-3xl" />

        {/* Middle: Purgatório (Twilight Ambient Aura) */}
        <div className="animate-float-slow absolute left-1/4 top-1/2 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-purple-600/25 blur-3xl" />
        <div className="animate-float-reverse absolute right-10 top-1/2 h-[32rem] w-[32rem] -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

        {/* Bottom: Inferno (Infernal Ember Aura) */}
        <div className="animate-float-slow absolute -left-10 bottom-10 h-[36rem] w-[36rem] rounded-full bg-red-600/30 blur-3xl" />
        <div className="animate-float-reverse absolute -right-10 bottom-0 h-[40rem] w-[40rem] rounded-full bg-orange-600/25 blur-3xl" />
      </div>

      {/* Floating background photos appearing along scroll in staggered positions */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30">
        {/* Photo 1 (Céu - Top Left) */}
        <div className="absolute left-[5%] top-[120px] aspect-[3/4] w-48 overflow-hidden rounded-xl border border-white/30 shadow-2xl shadow-sky-500/20 backdrop-blur-sm sm:w-64">
          <img src="/imagens/ceu.png" alt="" className="h-full w-full object-cover" />
        </div>

        {/* Photo 2 (Céu/Purgatório - Top Right Staggered) */}
        <div className="absolute right-[8%] top-[340px] aspect-[4/5] w-52 overflow-hidden rounded-xl border border-white/20 shadow-2xl shadow-purple-500/20 backdrop-blur-sm sm:w-72">
          <img src="/imagens/purgatorio.png" alt="" className="h-full w-full object-cover" />
        </div>

        {/* Photo 3 (Purgatório - Mid Left) */}
        <div className="absolute left-[10%] top-[680px] aspect-square w-44 overflow-hidden rounded-xl border border-purple-400/30 shadow-2xl shadow-purple-900/40 sm:w-60">
          <img src="/imagens/purgatorio.png" alt="" className="h-full w-full object-cover" />
        </div>

        {/* Photo 4 (Purgatório/Inferno - Mid Right Staggered) */}
        <div className="absolute right-[12%] top-[980px] aspect-[16/9] w-56 overflow-hidden rounded-xl border border-red-500/30 shadow-2xl shadow-red-900/40 sm:w-80">
          <img src="/imagens/inferno.png" alt="" className="h-full w-full object-cover" />
        </div>

        {/* Photo 5 (Inferno - Bottom Left) */}
        <div className="absolute left-[6%] top-[1320px] aspect-square w-48 overflow-hidden rounded-xl border border-red-600/40 shadow-2xl shadow-red-950/60 sm:w-68">
          <img src="/imagens/inferno.png" alt="" className="h-full w-full object-cover" />
        </div>
      </div>

      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-sky-700 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo principal
      </a>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4" aria-label="Navegação principal">
            <Link
              href="/"
              className="text-xl font-bold text-white transition-colors hover:text-sky-300"
            >
              Larp
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" className="relative z-10 min-h-dvh">
        {children}
      </main>
    </div>
  );
}
