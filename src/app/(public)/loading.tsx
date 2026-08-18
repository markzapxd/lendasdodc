"use client";

import { useTheme } from "@/components/theme/ThemeContext";

export default function Loading() {
  const { config } = useTheme();

  return (
    <div
      className="flex min-h-[60vh] w-full items-center justify-center py-20"
      role="status"
      aria-label="Carregando..."
    >
      <div className="relative flex items-center justify-center">
        {/* Glow effect background */}
        <div
          className="absolute h-12 w-12 rounded-full blur-md opacity-20"
          style={{ backgroundColor: config.primaryHex }}
        />
        {/* Spinning Circle */}
        <svg
          className="h-10 w-10 animate-spin"
          style={{ color: config.primaryHex }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-100"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
