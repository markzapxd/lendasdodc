import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

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
    <div className="relative min-h-dvh overflow-x-hidden text-slate-100">
      {/* Floating background photos appearing along scroll in staggered positions */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30">
        {/* Photo 1 (Céu - Top Left) */}
        <div className="absolute left-[5%] top-[120px] aspect-[3/4] w-48 overflow-hidden rounded-xl border border-white/30 shadow-2xl shadow-sky-500/20 backdrop-blur-sm sm:w-64">
          <Image src="/imagens/ceu.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 192px, 256px" />
        </div>

        {/* Photo 2 (Céu/Purgatório - Top Right Staggered) */}
        <div className="absolute right-[8%] top-[340px] aspect-[4/5] w-52 overflow-hidden rounded-xl border border-white/20 shadow-2xl shadow-purple-500/20 backdrop-blur-sm sm:w-72">
          <Image src="/imagens/purgatorio.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 208px, 288px" />
        </div>

        {/* Photo 3 (Purgatório - Mid Left) */}
        <div className="absolute left-[10%] top-[680px] aspect-square w-44 overflow-hidden rounded-xl border border-purple-400/30 shadow-2xl shadow-purple-900/40 sm:w-60">
          <Image src="/imagens/purgatorio.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 176px, 240px" />
        </div>

        {/* Photo 4 (Purgatório/Inferno - Mid Right Staggered) */}
        <div className="absolute right-[12%] top-[980px] aspect-[16/9] w-56 overflow-hidden rounded-xl border border-red-500/30 shadow-2xl shadow-red-900/40 sm:w-80">
          <Image src="/imagens/inferno.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 224px, 320px" />
        </div>

        {/* Photo 5 (Inferno - Bottom Left) */}
        <div className="absolute left-[6%] top-[1320px] aspect-square w-48 overflow-hidden rounded-xl border border-red-600/40 shadow-2xl shadow-red-950/60 sm:w-68">
          <Image src="/imagens/inferno.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 192px, 272px" />
        </div>
      </div>

      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-sky-700 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo principal
      </a>

      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#000d20]">
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

      <main id="conteudo" className="relative z-10 min-h-dvh pt-20">
        {children}
      </main>
    </div>
  );
}
