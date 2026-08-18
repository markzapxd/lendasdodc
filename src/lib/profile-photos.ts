import { createAdminClient } from "@/lib/supabase";

export interface ProfilePhoto {
  readonly id: string;
  readonly card_id: string;
  readonly image_url: string;
  readonly image_alt: string | null;
  readonly vote_count: number;
}

export async function getProfilePhotoRanking(cardId: string): Promise<readonly ProfilePhoto[]> {
  const supabase = createAdminClient();
  const [{ data: photos, error: photosError }, { data: votes, error: votesError }] =
    await Promise.all([
      supabase
        .schema("api")
        .from("profile_photos")
        .select("id, card_id, image_url, image_alt")
        .eq("card_id", cardId)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .schema("private")
        .from("profile_photo_votes")
        .select("photo_id")
        .eq("card_id", cardId),
    ]);
  if (photosError || votesError)
    throw new Error("Não foi possível carregar as fotos para votação.");

  const counts = new Map<string, number>();
  for (const vote of votes ?? []) counts.set(vote.photo_id, (counts.get(vote.photo_id) ?? 0) + 1);
  return (photos ?? [])
    .map((photo) => ({ ...photo, vote_count: counts.get(photo.id) ?? 0 }))
    .sort((left, right) => right.vote_count - left.vote_count || left.id.localeCompare(right.id));
}

export async function castProfilePhotoVote(cardId: string, photoId: string, sessionHmac: string) {
  const supabase = createAdminClient();
  const { data: photo, error: photoError } = await supabase
    .schema("api")
    .from("profile_photos")
    .select("id, card_id")
    .eq("id", photoId)
    .eq("card_id", cardId)
    .eq("is_active", true)
    .single();

  if (photoError || !photo) throw new Error("Foto indisponível para votação.");

  const { error } = await supabase.schema("private").from("profile_photo_votes").upsert(
    {
      card_id: cardId,
      photo_id: photoId,
      session_hmac: sessionHmac,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "card_id,session_hmac" },
  );
  if (error) throw new Error(`Não foi possível registrar o voto: ${error.message}`);
}

export async function addProfilePhoto(
  cardId: string,
  imageUrl: string,
  imageAlt: string | null = null,
) {
  const { data, error } = await createAdminClient()
    .schema("api")
    .from("profile_photos")
    .insert({ card_id: cardId, image_url: imageUrl, image_alt: imageAlt })
    .select("id, card_id, image_url, image_alt")
    .single();
  if (error) {
    if (error.message.includes("daily_profile_photo_limit_reached")) {
      throw new Error("Esta pessoa já enviou o limite de 3 fotos de hoje.");
    }
    throw new Error(`Não foi possível adicionar a foto: ${error.message}`);
  }
  return data;
}

export async function refreshProfilePhotoRankings(): Promise<number> {
  const { data, error } = await (
    createAdminClient().schema("api") as never as {
      rpc: (name: string) => Promise<{ data: number | null; error: { message: string } | null }>;
    }
  ).rpc("refresh_profile_photo_rankings");
  if (error) throw new Error(`Não foi possível atualizar o ranking: ${error.message}`);
  return data ?? 0;
}
