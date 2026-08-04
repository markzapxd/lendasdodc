import { unstable_cache } from "next/cache";
import { CardGrid } from "@/components/cards/CardGrid";
import { createAnonClient } from "@/lib/supabase";
import { parsePublicCard } from "@/lib/supabase/public-content";

const getPublicCards = unstable_cache(
  async () => {
    const { data, error } = await createAnonClient()
      .schema("api")
      .from("cards")
      .select(
        "id, name, slug, description, image_url, image_alt, status, message_count, last_activity_at, created_at, updated_at",
      )
      .eq("status", "active")
      .order("message_count", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch public cards: ${error.message}`, { cause: error });
    }

    return (data ?? []).map(parsePublicCard);
  },
  ["public-cards"],
  { revalidate: 60, tags: ["public-cards"] },
);

export default async function HomePage() {
  const cards = await getPublicCards();

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <h1 className="sr-only">Lendas do DC</h1>
      <CardGrid cards={cards} />
    </div>
  );
}
