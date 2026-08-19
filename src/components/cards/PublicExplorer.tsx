"use client";

import {
  CaretDown,
  ChatCircleDots,
  Check,
  MagnifyingGlass,
  SortAscending,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { AsciiHero3D } from "@/components/system/AsciiHero3D";
import type { Card } from "@/types/database";
import { CardCard } from "./CardCard";

type SortMode = "name" | "messages";

interface GoogleSortDropdownProps {
  readonly sortMode: SortMode;
  readonly onChange: (mode: SortMode) => void;
}

function GoogleSortDropdown({ sortMode, onChange }: GoogleSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const options: Array<{ id: SortMode; label: string; icon: typeof SortAscending }> = [
    { id: "name", label: "Ordem A-Z", icon: SortAscending },
    { id: "messages", label: "Por mensagens", icon: ChatCircleDots },
  ];

  const currentOption = options.find((opt) => opt.id === sortMode) ?? options[0]!;
  const CurrentIcon = currentOption.icon;

  return (
    <div ref={dropdownRef} className="relative w-full sm:w-auto shrink-0">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Selecionar ordenação"
        className={`flex h-[42px] w-full sm:w-[185px] items-center justify-between gap-2.5 rounded-xl border px-3.5 text-xs sm:text-sm font-medium text-white transition-all outline-none ${
          isOpen
            ? "border-white/30 bg-[#2b2b2b] shadow-md ring-2 ring-white/10"
            : "border-white/10 bg-[#212121] hover:border-white/20 hover:bg-[#262626]"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CurrentIcon className="h-4 w-4 text-[#38bdf8] shrink-0" />
          <span className="truncate">{currentOption.label}</span>
        </div>
        <CaretDown
          className={`h-4 w-4 text-[#aaaaaa] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Google-Style Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 z-50 w-full sm:w-[200px] overflow-hidden rounded-2xl border border-white/15 bg-[#282828] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-[#888888] uppercase">
            Ordenar por
          </div>
          <div className="space-y-0.5">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = sortMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-white/15 text-white font-semibold"
                      : "text-[#cccccc] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`h-4 w-4 ${isSelected ? "text-[#38bdf8]" : "text-[#aaaaaa]"}`}
                    />
                    <span>{option.label}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-[#38bdf8] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface PublicExplorerProps {
  readonly initialCards: readonly Card[];
}

export function PublicExplorer({ initialCards }: PublicExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedSort = localStorage.getItem("explorer_sort_mode");
      if (savedSort === "name" || savedSort === "messages") {
        setSortMode(savedSort);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const handleSortChange = (newMode: SortMode) => {
    setSortMode(newMode);
    try {
      localStorage.setItem("explorer_sort_mode", newMode);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

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

          {/* Google Sort Dropdown */}
          <GoogleSortDropdown sortMode={sortMode} onChange={handleSortChange} />
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
