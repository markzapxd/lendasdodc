export async function getRandomNekoImages(count: number): Promise<string[]> {
  try {
    const amount = Math.max(1, Math.min(count, 20));
    const response = await fetch(`/api/nekos?count=${amount}`);

    if (!response.ok) return [];

    const data = (await response.json()) as { images?: string[] };
    return data.images ?? [];
  } catch (error) {
    console.error("Error fetching images from /api/nekos:", error);
    return [];
  }
}
