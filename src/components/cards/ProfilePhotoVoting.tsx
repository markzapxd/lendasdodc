"use client";

import { Crown, Heart } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import type { ProfilePhoto } from "@/lib/profile-photos";

interface ProfilePhotoVotingProps {
  readonly cardId: string;
  readonly leaderId: string | null;
  readonly photos: readonly ProfilePhoto[];
}

export function ProfilePhotoVoting({ cardId, leaderId, photos }: ProfilePhotoVotingProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (photos.length === 0) return null;

  async function vote(photoId: string) {
    setSelectedId(photoId);
    setError(null);
    const response = await fetch("/api/profile-photos/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, photoId }),
    });
    const result: { success: boolean; error?: string } = await response.json();
    if (!result.success) setError(result.error ?? "Não foi possível registrar o voto.");
    setSelectedId(null);
  }

  return (
    <section
      aria-labelledby="profile-photo-voting-title"
      className="w-full border-b border-white/10 px-4 py-5 sm:px-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="profile-photo-voting-title" className="text-sm font-bold text-white">
            Escolha a foto principal
          </h2>
          <p className="mt-1 text-xs text-[#a595b8]">
            Um voto por perfil; você pode trocar sua escolha. A líder é atualizada a cada hora.
          </p>
        </div>
        <span className="shrink-0 text-xs font-mono text-[#a595b8]">{photos.length} fotos</span>
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Ranking de fotos">
        {photos.map((photo, index) => {
          const isLeader = photo.id === leaderId;
          const submitting = selectedId === photo.id;
          return (
            <li
              key={photo.id}
              className={`overflow-hidden rounded-xl border ${isLeader ? "border-amber-400/70 bg-amber-400/10" : "border-white/10 bg-white/[0.03]"}`}
            >
              <div className="relative aspect-square">
                <Image
                  src={photo.image_url}
                  alt={photo.image_alt ?? "Foto candidata"}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[11px] font-bold text-white">
                  #{index + 1}
                </span>
                {isLeader ? (
                  <span
                    className="absolute right-2 top-2 rounded-full bg-amber-400 p-1.5 text-black"
                    title="Foto principal atual"
                  >
                    <Crown weight="fill" className="size-3.5" />
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5">
                <span className="text-xs font-semibold text-white">
                  {photo.vote_count} {photo.vote_count === 1 ? "voto" : "votos"}
                </span>
                <button
                  type="button"
                  onClick={() => vote(photo.id)}
                  disabled={selectedId !== null}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <Heart weight="fill" className="size-3" /> {submitting ? "..." : "Votar"}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </section>
  );
}
