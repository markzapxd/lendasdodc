import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileAvatar } from "@/components/cards/ProfileAvatar";
import { ProfilePhotoVoting } from "@/components/cards/ProfilePhotoVoting";
import { MessageFeed } from "@/components/messages/MessageFeed";
import { getProfilePhotoRanking } from "@/lib/profile-photos";
import { createAnonClient } from "@/lib/supabase";
import {
  parsePublicCard,
  parsePublicCardMetadata,
  parsePublicMessage,
} from "@/lib/supabase/public-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CardPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAnonClient();

  const { data: card } = await supabase
    .schema("api")
    .from("cards")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!card) {
    return { title: "Perfil não encontrado" };
  }

  const cardMetadata = parsePublicCardMetadata(card);

  return {
    title: `${cardMetadata.name} (@${slug}) - LARP`,
  };
}

export default async function CardPage({ params }: CardPageProps) {
  const { slug } = await params;
  const supabase = createAnonClient();

  const { data: card } = await supabase
    .schema("api")
    .from("cards")
    .select(
      "id, name, slug, description, image_url, image_alt, profile_photo_id, status, message_count, last_activity_at, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!card) {
    notFound();
  }

  const publicCard = parsePublicCard(card);

  const [profilePhotos, { data: messages }] = await Promise.all([
    getProfilePhotoRanking(publicCard.id),
    supabase
      .schema("api")
      .from("messages")
      .select("id, card_id, content, nickname, status, published_at, created_at, updated_at")
      .eq("card_id", publicCard.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl min-h-screen border-x border-white/10 bg-black">
      {/* Top Bar Header */}
      <header className="sticky top-14 z-40 flex items-center gap-4 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#a595b8] hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-white leading-tight">{publicCard.name}</h1>
          <p className="text-xs text-[#a595b8]">
            {publicCard.message_count} {publicCard.message_count === 1 ? "mensagem" : "mensagens"}
          </p>
        </div>
      </header>

      {/* Profile Header Centered */}
      <section className="flex flex-col items-center justify-center border-b border-white/10 p-6 text-center">
        {/* Avatar Container */}
        <div className="relative">
          <ProfileAvatar
            imageUrl={publicCard.image_url}
            imageAlt={publicCard.image_alt}
            name={publicCard.name}
          />
        </div>

        {/* User Info */}
        <div className="mt-3">
          <h2 className="text-2xl font-black text-white">{publicCard.name}</h2>
          <p className="text-sm font-normal text-[#a595b8]">@{publicCard.slug}</p>
        </div>

        {publicCard.description ? (
          <p className="mt-2.5 max-w-md text-sm text-white/90 leading-relaxed">
            {publicCard.description}
          </p>
        ) : null}
      </section>

      <ProfilePhotoVoting
        cardId={publicCard.id}
        leaderId={publicCard.profile_photo_id}
        photos={profilePhotos}
      />

      {/* Message Feed & Inline Post Composer */}
      <MessageFeed
        messages={(messages ?? []).map(parsePublicMessage)}
        cardId={publicCard.id}
        cardName={publicCard.name}
      />
    </div>
  );
}
