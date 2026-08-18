"use client";

import { ChatCircleDots, MagnifyingGlass, SortAscending, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { AsciiHero3D } from "@/components/system/AsciiHero3D";
import type { Card } from "@/types/database";
import { CardCard } from "./CardCard";

type SortMode = "name" | "messages";

interface PublicExplorerProps {
  readonly initialCards: readonly Card[];
}

export function PublicExplorer({ initialCards }: PublicExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrame: number | undefined;

    const updateBackgroundPosition = () => {
      animationFrame = undefined;
      const offset = Math.max(window.scrollY * -0.12, -180);
      backgroundRef.current?.style.setProperty("--background-scroll-offset", `${offset}px`);
    };

    const handleScroll = () => {
      if (animationFrame === undefined) {
        animationFrame = window.requestAnimationFrame(updateBackgroundPosition);
      }
    };

    updateBackgroundPosition();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const filteredCards = [...initialCards]
    .filter((card) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return card.name.toLowerCase().includes(query) || card.slug.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (sortMode === "messages") {
        return b.message_count - a.message_count;
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div ref={backgroundRef} className="public-page-background" aria-hidden="true" />
      <div className="public-page-background-overlay" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        {/* 3D Visualizer */}
        <AsciiHero3D />

        {/* Search + Sort Controls */}
        <div className="mx-auto mb-6 flex flex-col sm:flex-row items-center gap-3 max-w-lg">
          {/* Search */}
          <div className="relative flex items-center flex-1 w-full">
            <MagnifyingGlass className="absolute left-3.5 h-4 w-4 text-[#aaaaaa]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome..."
              className="w-full rounded-xl border border-white/10 bg-[#212121] py-2.5 pl-10 pr-9 text-xs sm:text-sm text-white placeholder:text-[#aaaaaa] outline-none transition-all focus:border-white/25 focus:bg-[#272727]"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-[#aaaaaa] hover:text-white transition-colors"
                aria-label="Limpar pesquisa"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {/* Sort Toggle */}
          <div className="flex items-center rounded-xl border border-white/10 bg-[#212121] overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setSortMode("name")}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition-all ${
                sortMode === "name"
                  ? "bg-white/15 text-white"
                  : "text-[#aaaaaa] hover:text-white hover:bg-white/5"
              }`}
            >
              <SortAscending className="h-4 w-4" />
              A-Z
            </button>
            <button
              type="button"
              onClick={() => setSortMode("messages")}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition-all ${
                sortMode === "messages"
                  ? "bg-white/15 text-white"
                  : "text-[#aaaaaa] hover:text-white hover:bg-white/5"
              }`}
            >
              <ChatCircleDots className="h-4 w-4" />
              Msgs
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="py-12 text-center text-xs sm:text-sm text-[#a595b8]">
            {searchQuery
              ? `Nenhum perfil encontrado para "${searchQuery}".`
              : "Nenhuma pessoa cadastrada ainda."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredCards.map((card) => (
              <CardCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
