"use client";

import Image from "next/image";
import { useTheme } from "@/components/theme/ThemeContext";

interface ProfileAvatarProps {
  readonly imageUrl?: string | null;
  readonly imageAlt?: string | null;
  readonly name: string;
}

export function ProfileAvatar({ imageUrl, imageAlt, name }: ProfileAvatarProps) {
  const { config } = useTheme();
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-[#121929] ring-4 ring-[#090d16] shadow-lg">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageAlt ?? name}
          width={80}
          height={80}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-2xl font-extrabold" style={{ color: config.primaryHex }}>
          {initial}
        </span>
      )}
    </div>
  );
}
