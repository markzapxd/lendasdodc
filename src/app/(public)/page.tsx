import { CardGrid } from "@/components/cards/CardGrid";
import { createAnonClient } from "@/lib/supabase";
import { parsePublicCard } from "@/lib/supabase/public-content";

export default async function HomePage() {
  const supabase = createAnonClient();

  const { data: cards } = await supabase
    .schema("api")
    .from("cards")
    .select(
      "id, name, slug, description, image_url, image_alt, status, message_count, last_activity_at, created_at, updated_at",
    )
    .eq("status", "active")
    .order("message_count", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <header className="mb-10 grid max-w-3xl gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-500">Mural aberto</p>
        <h1 className="text-4xl font-bold leading-tight text-text-primary sm:text-5xl">
          Lendas do DC
        </h1>
        <p className="max-w-2xl text-lg text-text-secondary">
          Escolha uma heroína e envie sua mensagem anônima.
        </p>
      </header>

      <CardGrid cards={(cards ?? []).map(parsePublicCard)} />
    </div>
  );
}
