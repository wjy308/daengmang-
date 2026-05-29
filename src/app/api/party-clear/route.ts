import { NextResponse } from "next/server";
import { markPartyCleared } from "@/lib/server/raid-store";
import type { RaidId } from "@/lib/raids";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      raidId?: RaidId;
      members?: { userId: string; characterId: string }[];
    };

    if (!body.raidId || !Array.isArray(body.members) || body.members.length === 0) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    await markPartyCleared(
      body.raidId,
      body.members.map((m) => ({
        userId: String(m.userId),
        characterId: String(m.characterId),
      })),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "클리어 처리에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
