import { NextResponse } from "next/server";
import sharp from "sharp";

export interface NekoResult {
  url: string;
  artist_name?: string;
  source_url?: string;
}

async function fetchAndOptimize(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LendasDoDC/1.0 (https://github.com/markzapxd/lendasdodc)",
      },
    });
    if (!res.ok) return null;

    const buf = await res.arrayBuffer();
    const optimized = await sharp(Buffer.from(buf))
      .resize(128, 128, { fit: "cover", position: "center" })
      .webp({ quality: 72 })
      .toBuffer();

    return `data:image/webp;base64,${optimized.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Number.parseInt(searchParams.get("count") || "10", 10);
  const amount = Math.max(1, Math.min(count, 20));

  const categories = ["neko", "husbando", "kitsune", "waifu"];
  const category = categories[Math.floor(Math.random() * categories.length)];

  try {
    const response = await fetch(`https://nekos.best/api/v2/${category}?amount=${amount}`, {
      headers: {
        "User-Agent": "LendasDoDC/1.0 (https://github.com/markzapxd/lendasdodc)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ images: [] }, { status: 200 });
    }

    const data = (await response.json()) as { results?: NekoResult[] };
    const urls = data.results?.map((r) => r.url) ?? [];

    // Fetch + optimize ALL images in parallel in one batch
    const optimized = await Promise.all(urls.map(fetchAndOptimize));
    const images = optimized.filter((img): img is string => img !== null);

    return NextResponse.json(
      { images },
      {
        headers: {
          "Cache-Control": "public, max-age=900, s-maxage=900, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Error proxying nekos.best API:", error);
    return NextResponse.json({ images: [] }, { status: 200 });
  }
}
