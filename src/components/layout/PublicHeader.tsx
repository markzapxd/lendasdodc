"use client";

import { Palette } from "@phosphor-icons/react";
import Link from "next/link";
import { THEMES, type ThemeMode, useTheme } from "@/components/theme/ThemeContext";

export function PublicHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0000000] backdrop-blur-md select-none">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-white hover:opacity-80 transition-opacity"
        >
          Resenha
        </Link>

        {/* Theme Palette Switcher */}
        <div className="flex items-center gap-1.5 rounded-full border border-[#21122e] bg-[#140822]/80 px-2.5 py-1">
          <Palette className="h-3.5 w-3.5 text-[#a595b8]/70 mr-0.5 hidden sm:block" />
          {(Object.keys(THEMES) as ThemeMode[]).map((mode) => {
            const item = THEMES[mode];
            const isSelected = theme === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                title={`Tema ${item.name}`}
                className={`h-4 w-4 rounded-full ${item.dotClass} transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-white scale-125 shadow-md"
                    : "opacity-40 hover:opacity-100 hover:scale-110"
                }`}
              />
            );
          })}
        </div>
      </div>
    </header>
  );
}
