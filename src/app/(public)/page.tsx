import { PublicExplorer } from "@/components/cards/PublicExplorer";
import { createAnonClient } from "@/lib/supabase";
import { parsePublicCard } from "@/lib/supabase/public-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPublicCards() {
  const { data, error } = await createAnonClient()
    .schema("api")
    .from("cards")
    .select(
      "id, name, slug, description, image_url, image_alt, status, message_count, last_activity_at, created_at, updated_at",
    )
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch public cards: ${error.message}`, { cause: error });
  }

  return (data ?? []).map(parsePublicCard);
}

export default async function HomePage() {
  const cards = await getPublicCards();

  return <PublicExplorer initialCards={cards} />;
}
