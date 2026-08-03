import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lendas do DC",
  description: "Mensagens anônimas para suas heroínas favoritas",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-red-500 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-text-inverse"
      >
        Pular para o conteúdo principal
      </a>
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4" aria-label="Navegação principal">
            <Link href="/" className="text-xl font-bold text-text-primary">
              Lendas do DC
            </Link>
            <p className="text-sm text-text-secondary">Mensagens anônimas</p>
          </nav>
        </div>
      </header>
      <main id="conteudo" className="min-h-dvh bg-surface">
        {children}
      </main>
    </>
  );
}
