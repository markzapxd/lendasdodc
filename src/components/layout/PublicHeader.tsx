"use client";

import { House } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PublicHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-[#21122e] bg-[#090410]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-white hover:text-pink-300 transition-colors"
        >
          LARP
        </Link>

        {/* Navigation Link */}
        <nav aria-label="Navegação principal" className="flex items-center gap-6">
          <Link
            href="/"
            className={`flex items-center gap-2 text-sm font-medium transition-colors py-1 ${
              isHome
                ? "text-white border-b-2 border-[#ec195a] font-semibold"
                : "text-[#a595b8] hover:text-white"
            }`}
          >
            <House weight={isHome ? "fill" : "regular"} className="h-4 w-4 text-[#ec195a]" />
            Início
          </Link>
        </nav>
      </div>
    </header>
  );
}
