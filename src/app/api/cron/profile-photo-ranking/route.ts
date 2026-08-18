import { type NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";
import { refreshProfilePhotoRankings } from "@/lib/profile-photos";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get("authorization") !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const updated = await refreshProfilePhotoRankings();
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Profile photo ranking cron failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
