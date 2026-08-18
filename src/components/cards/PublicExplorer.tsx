"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { AsciiHero3D } from "@/components/system/AsciiHero3D";
import { getCachedAvatarMap, setCachedAvatarMap } from "@/lib/avatar-cache";
import { getRandomNekoImages } from "@/lib/nekos";
import type { Card } from "@/types/database";
import { CardCard } from "./CardCard";

interface PublicExplorerProps {
  readonly initialCards: readonly Card[];
}

export function PublicExplorer({ initialCards }: PublicExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [nekoImages, setNekoImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    // 1. Instantly load from 15-minute local cache if available
    const cachedMap = getCachedAvatarMap();
    if (Object.keys(cachedMap).length > 0) {
      setNekoImages(cachedMap);
    }

    // 2. Find cards missing cached images
    const missingCards = initialCards.filter((card) => !card.image_url && !cachedMap[card.id]);
    if (missingCards.length === 0) return;

    // 3. Fetch missing images in ONE single batch API request
    getRandomNekoImages(missingCards.length).then((images) => {
      if (!isMounted || images.length === 0) return;

      const newEntries: Record<string, string> = {};
      missingCards.forEach((card, index) => {
        const img = images[index % images.length];
        if (img) {
          newEntries[card.id] = img;
        }
      });

      setNekoImages((prev) => {
        const updated = { ...prev, ...newEntries };
        setCachedAvatarMap(updated);
        return updated;
      });
    });

    return () => {
      isMounted = false;
    };
  }, [initialCards]);

  const filteredCards = [...initialCards]
    .filter((card) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        card.name.toLowerCase().includes(query) ||
        card.slug.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

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
            className="w-full rounded-xl border border-white/10 bg-[#212121] py-2.5 pl-10 pr-9 text-xs sm:text-sm text-white placeholder:text-[#aaaaaa] outline-none transition-all focus:border-white/25 focus:bg-[#272727]"
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
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredCards.map((card) => {
            const avatarUrl = nekoImages[card.id] || card.image_url;
            const cardWithAvatar = avatarUrl ? { ...card, image_url: avatarUrl } : card;
            return <CardCard key={card.id} card={cardWithAvatar} />;
          })}
        </div>
      )}
    </div>
  );
}
