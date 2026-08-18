"use client";

import { useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { AsciiHero3D } from "@/components/system/AsciiHero3D";
import type { Card } from "@/types/database";
import { CardCard } from "./CardCard";

interface PublicExplorerProps {
  readonly initialCards: readonly Card[];
}

export function PublicExplorer({ initialCards }: PublicExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = initialCards.filter((card) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      card.name.toLowerCase().includes(query) ||
      card.slug.toLowerCase().includes(query)
    );
  });

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      {/* 3D Visualizer */}
      <AsciiHero3D />

      {/* Search Input Bar */}
      <div className="mx-auto mb-6 max-w-md">
        <div className="relative flex items-center">
          <MagnifyingGlass className="absolute left-3.5 h-4 w-4 text-[#a595b8]/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome..."
            className="w-full rounded-xl border border-[#2b1742]/60 bg-[#12081a]/80 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-white placeholder:text-[#a595b8]/50 outline-none transition-all focus:border-[#ec195a]/60 focus:bg-[#1a0c24]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-[#a595b8]/70 hover:text-white transition-colors"
              aria-label="Limpar pesquisa"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
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
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => (
            <CardCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
