import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageFeed } from "@/components/messages/MessageFeed";
import { createAnonClient } from "@/lib/supabase";
import {
  parsePublicCard,
  parsePublicCardMetadata,
  parsePublicMessage,
} from "@/lib/supabase/public-content";

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
    return { title: "Card não encontrado" };
  }

  const cardMetadata = parsePublicCardMetadata(card);

  return {
    title: `${cardMetadata.name} - larpolandia`,
  };
}

export default async function CardPage({ params }: CardPageProps) {
  const { slug } = await params;
  const supabase = createAnonClient();

  const { data: card } = await supabase
    .schema("api")
    .from("cards")
    .select(
      "id, name, slug, description, image_url, image_alt, status, message_count, last_activity_at, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!card) {
    notFound();
  }

  const publicCard = parsePublicCard(card);

  const { data: messages } = await supabase
    .schema("api")
    .from("messages")
    .select("id, card_id, content, nickname, status, published_at, created_at, updated_at")
    .eq("card_id", publicCard.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <header className="mb-10 grid max-w-3xl gap-3">
        <h1 className="text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          {publicCard.name}
        </h1>
        {publicCard.description ? (
          <p className="text-lg text-text-secondary">{publicCard.description}</p>
        ) : null}
      </header>

      <MessageFeed
        messages={(messages ?? []).map(parsePublicMessage)}
        cardId={publicCard.id}
        cardName={publicCard.name}
      />
    </div>
  );
}
